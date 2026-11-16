import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { AppError } from "./errors";
import { authSecret } from "./secret";

export const SESSION_COOKIE = "plz_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 jam (1 shift panjang)

export type StaffRole = "STAFF" | "ADMIN";
export type SessionUser = { id: number; name: string; email: string; role: StaffRole };

const key = () => new TextEncoder().encode(authSecret());

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

let dummyHash: string | undefined;

export async function verifyLogin(email: string, password: string): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !user.isActive || user.role === "CUSTOMER") {
    // tetap jalankan bcrypt agar waktu respon tidak membocorkan email terdaftar
    dummyHash ??= await bcrypt.hash("dummy-password", 10);
    await bcrypt.compare(password, dummyHash);
    return null;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role as StaffRole };
}

export async function startSession(user: SessionUser) {
  const token = await new SignJWT({ name: user.name, email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(key());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

async function readSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return {
      id: Number(payload.sub),
      name: String(payload.name),
      email: String(payload.email),
      role: payload.role === "ADMIN" ? "ADMIN" : "STAFF",
    };
  } catch {
    return null;
  }
}

/** Sesi + cek ulang ke DB bahwa akun masih aktif. */
export async function getCurrentStaff(): Promise<SessionUser | null> {
  const s = await readSession();
  if (!s) return null;
  const u = await prisma.user.findUnique({ where: { id: s.id }, select: { isActive: true, role: true, name: true } });
  if (!u || !u.isActive || u.role === "CUSTOMER") return null;
  return { ...s, name: u.name, role: u.role as StaffRole };
}

/** Untuk Route Handler: lempar 401/403 bila tidak berhak. */
export async function requireStaffApi(roles: StaffRole[] = ["STAFF", "ADMIN"]) {
  const user = await getCurrentStaff();
  if (!user) throw new AppError(401, "Silakan login sebagai staf/admin.");
  if (!roles.includes(user.role)) throw new AppError(403, "Akses khusus admin.");
  return user;
}

/** Untuk halaman dashboard: redirect ke login bila tidak berhak. */
export async function requireStaffPage(roles: StaffRole[] = ["STAFF", "ADMIN"]) {
  const user = await getCurrentStaff();
  if (!user) redirect("/admin/login");
  if (!roles.includes(user.role)) redirect("/admin?forbidden=1");
  return user;
}
