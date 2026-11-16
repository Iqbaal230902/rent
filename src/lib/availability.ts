import type { Prisma } from "@prisma/client";
import { prisma } from "./db";

type Db = Prisma.TransactionClient;

/** Status yang mengunci slot unit. PENDING_PAYMENT hanya selama hold belum lewat. */
export const BLOCKING_STATUSES = ["PENDING_PAYMENT", "PAID", "IN_USE"] as const;

export function blockingWhere(now: Date): Prisma.BookingWhereInput {
  return {
    OR: [
      { status: { in: ["PAID", "IN_USE"] } },
      { status: "PENDING_PAYMENT", holdExpiresAt: { gt: now } },
    ],
  };
}

/**
 * Puncak jumlah unit yang terpakai bersamaan di dalam [start, end).
 * Pakai sweep line, bukan sekadar jumlah booking yang tumpang tindih, supaya
 * dua booking berurutan (08–10 dan 12–14) tidak dihitung memakai 2 unit.
 */
export function peakUsage(
  intervals: { start: Date; end: Date; qty: number }[],
  windowStart: Date,
  windowEnd: Date,
): number {
  const events: [number, number][] = [];
  for (const iv of intervals) {
    const s = Math.max(iv.start.getTime(), windowStart.getTime());
    const e = Math.min(iv.end.getTime(), windowEnd.getTime());
    if (s < e) {
      events.push([s, iv.qty], [e, -iv.qty]);
    }
  }
  // Pada waktu yang sama, proses "selesai" sebelum "mulai" (slot back-to-back boleh).
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let cur = 0;
  let peak = 0;
  for (const [, d] of events) {
    cur += d;
    if (cur > peak) peak = cur;
  }
  return peak;
}

export type ModelAvailability = {
  modelId: number;
  totalUnits: number;
  inUseOrBooked: number;
  available: number;
};

/**
 * Sisa unit untuk satu model pada rentang waktu.
 * Stok = unit aktif (AVAILABLE) − puncak booking HOLD / PAID / IN_USE yang tumpang tindih.
 * Booking IN_USE yang terlambat dianggap masih memakai unit sampai sekarang.
 */
export async function getModelAvailability(
  db: Db,
  modelId: number,
  start: Date,
  end: Date,
  opts: { now?: Date; excludeBookingId?: number } = {},
): Promise<ModelAvailability> {
  const now = opts.now ?? new Date();
  const [totalUnits, bookings] = await Promise.all([
    db.bikeUnit.count({ where: { modelId, status: "AVAILABLE", model: { isActive: true } } }),
    db.booking.findMany({
      where: {
        modelId,
        startAt: { lt: end },
        OR: [{ endAt: { gt: start } }, { status: "IN_USE" }],
        AND: [blockingWhere(now)],
        ...(opts.excludeBookingId ? { id: { not: opts.excludeBookingId } } : {}),
      },
      select: { startAt: true, endAt: true, quantity: true, status: true },
    }),
  ]);
  // Booking IN_USE yang sudah lewat jam selesai belum tentu kembali sekarang;
  // anggap unitnya masih terpakai sampai 1 jam ke depan agar slot dekat tidak overbook.
  const overdueUntil = new Date(now.getTime() + 60 * 60_000);
  const intervals = bookings.map((b) => ({
    start: b.startAt,
    end: b.status === "IN_USE" && b.endAt < now ? overdueUntil : b.endAt,
    qty: b.quantity,
  }));
  const used = peakUsage(intervals, start, end);
  return { modelId, totalUnits, inUseOrBooked: used, available: Math.max(0, totalUnits - used) };
}

export async function getAllAvailability(start: Date, end: Date, now = new Date()) {
  const models = await prisma.bikeModel.findMany({ where: { isActive: true }, select: { id: true } });
  const results = await Promise.all(models.map((m) => getModelAvailability(prisma, m.id, start, end, { now })));
  return Object.fromEntries(results.map((r) => [r.modelId, r]));
}
