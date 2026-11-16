import { NextResponse } from "next/server";
import { AppError, handle } from "@/lib/errors";
import { requireStaffApi } from "@/lib/auth";
import { parseScanInput } from "@/lib/qr";
import { prisma } from "@/lib/db";
import { bookingDetailInclude, checkinWindow, expireHolds, handoverCandidates, previewCheckout } from "@/lib/booking";
import { getSettings } from "@/lib/settings";

// Hasil scan QR (atau kode booking manual) → detail booking + data untuk check-in / check-out.
export const GET = handle(async (req: Request) => {
  await requireStaffApi();
  const q = new URL(req.url).searchParams.get("q") ?? "";
  const parsed = parseScanInput(q);
  if (!parsed) throw new AppError(400, "QR tidak valid atau bukan QR Pleazure. Coba ketik kode booking (PLZ-XXXXXX).");
  await expireHolds();
  const b = await prisma.booking.findUnique({ where: { code: parsed.code }, include: bookingDetailInclude });
  if (!b) throw new AppError(404, `Booking ${parsed.code} tidak ditemukan.`);

  const settings = await getSettings();
  const now = new Date();
  const win = checkinWindow(b, settings.checkinEarlyMinutes);
  const candidates = b.status === "PAID" ? await handoverCandidates(prisma, b.modelId) : [];
  const checkout = b.status === "IN_USE" ? await previewCheckout(b.id, now) : null;

  let rejection: string | null = null;
  if (b.status === "EXPIRED") rejection = "QR ditolak: booking sudah kedaluwarsa.";
  if (b.status === "CANCELLED") rejection = "QR ditolak: booking sudah dibatalkan.";
  if (b.status === "COMPLETED") rejection = "QR ditolak: booking sudah selesai.";

  return NextResponse.json({
    viaQr: parsed.viaQr,
    rejection,
    booking: {
      id: b.id,
      code: b.code,
      status: b.status,
      customerName: b.customerName,
      customerPhone: b.customerPhone,
      modelName: b.model.name,
      category: b.model.category,
      quantity: b.quantity,
      startAt: b.startAt,
      endAt: b.endAt,
      totalAmount: b.totalAmount,
      units: b.units.map((u) => ({ id: u.unit?.id ?? null, serialNumber: u.unit?.serialNumber ?? null })),
      rental: b.rental && {
        collateralType: b.rental.collateralType,
        collateralNote: b.rental.collateralNote,
        checkedInAt: b.rental.checkedInAt,
        checkedInBy: b.rental.checkedInBy.name,
      },
    },
    checkin: {
      opensAt: win.opensAt,
      closesAt: win.closesAt,
      open: now >= win.opensAt && now <= win.closesAt,
      candidates,
    },
    checkout,
  });
});
