import { NextResponse } from "next/server";
import { AppError, handle } from "@/lib/errors";
import { loginSchema } from "@/lib/validators";
import { startSession, verifyLogin } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/booking";

export const POST = handle(async (req: Request) => {
  if (!rateLimit(`login:${clientIp(req)}`, 6, 60_000)) {
    throw new AppError(429, "Terlalu banyak percobaan login. Coba lagi dalam 1 menit.");
  }
  const { email, password } = loginSchema.parse(await req.json());
  const user = await verifyLogin(email, password);
  if (!user) throw new AppError(401, "Email atau password salah.");
  await startSession(user);
  await audit(prisma, user.id, "LOGIN", "user", user.id);
  return NextResponse.json({ ok: true, user: { name: user.name, role: user.role } });
});
