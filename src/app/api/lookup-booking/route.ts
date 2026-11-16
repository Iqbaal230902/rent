import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { AppError, handle } from "@/lib/errors";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  code: z.string().trim().toUpperCase(),
  phone: z.string().trim().transform((s) => s.replace(/\D/g, "").replace(/^62/, "0")),
});

// Pelanggan yang kehilangan link: cari booking dengan kode + nomor WhatsApp.
export const POST = handle(async (req: Request) => {
  if (!rateLimit(`lookup:${clientIp(req)}`, 10, 60_000)) throw new AppError(429, "Terlalu banyak percobaan.");
  const { code, phone } = schema.parse(await req.json());
  const b = await prisma.booking.findUnique({ where: { code }, select: { publicToken: true, customerPhone: true } });
  const norm = (s: string) => s.replace(/\D/g, "").replace(/^62/, "0");
  if (!b || norm(b.customerPhone) !== phone) {
    throw new AppError(404, "Booking tidak ditemukan. Periksa kode & nomor WhatsApp.");
  }
  return NextResponse.json({ url: `/booking/${b.publicToken}` });
});
