export function authSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error("AUTH_SECRET belum diset (minimal 32 karakter). Lihat .env.example.");
  }
  return s;
}
