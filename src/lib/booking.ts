// Layanan inti booking: buat + hold, expire, konfirmasi bayar, invoice,
// check-in, check-out. Semua perubahan stok/status di dalam DB transaction.
import { Prisma, type PaymentMethod, type CollateralType } from "@prisma/client";
import { prisma } from "./db";
import { AppError } from "./errors";
import { blockingWhere, getModelAvailability, peakUsage } from "./availability";
import { computeLateFee, computeQuote, validateRentalWindow } from "./pricing";
import { getSettings, rulesFrom } from "./settings";
import { newBookingCode, newPublicToken } from "./qr";
import { getPaymentProvider } from "./payment";
import { wibParts } from "./time";
import type { SessionUser } from "./auth";

type Tx = Prisma.TransactionClient;

const TX_OPTS = {
  isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
  maxWait: 10_000,
  timeout: 15_000,
};

export async function audit(
  db: Tx,
  actorId: number | null,
  action: string,
  entity: string,
  entityId: string | number | null,
  data?: Prisma.InputJsonValue,
) {
  await db.auditLog.create({
    data: { actorId, action, entity, entityId: entityId == null ? null : String(entityId), data },
  });
}

/** Kunci baris model sepeda: menserialkan semua perubahan stok untuk model ini. */
async function lockModel(tx: Tx, modelId: number) {
  await tx.$queryRaw`SELECT id FROM bike_models WHERE id = ${modelId} FOR UPDATE`;
}

async function lockBooking(tx: Tx, bookingId: number) {
  await tx.$queryRaw`SELECT id FROM bookings WHERE id = ${bookingId} FOR UPDATE`;
}

// ---------------------------------------------------------------------------
// Expire hold (cron + dipanggil lazy saat membaca)
// ---------------------------------------------------------------------------
export async function expireHolds(now = new Date()) {
  const res = await prisma.booking.updateMany({
    where: { status: "PENDING_PAYMENT", holdExpiresAt: { lte: now } },
    data: { status: "EXPIRED", expiredAt: now },
  });
  return res.count;
}

// ---------------------------------------------------------------------------
// Buat booking
// ---------------------------------------------------------------------------
export type CreateBookingInput = {
  modelId: number;
  quantity: number;
  start: Date;
  end: Date;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  notes?: string;
};

export async function createBooking(input: CreateBookingInput, now = new Date()) {
  const settings = await getSettings();
  const err = validateRentalWindow(input.start, input.end, rulesFrom(settings), now);
  if (err) throw new AppError(400, err);

  const provider = getPaymentProvider();

  const booking = await prisma.$transaction(async (tx) => {
    await lockModel(tx, input.modelId);
    const model = await tx.bikeModel.findUnique({ where: { id: input.modelId } });
    if (!model || !model.isActive) throw new AppError(404, "Model sepeda tidak ditemukan.");

    const avail = await getModelAvailability(tx, model.id, input.start, input.end, { now });
    if (avail.available < input.quantity) {
      throw new AppError(
        409,
        avail.available === 0
          ? "Maaf, unit tidak tersedia untuk rentang waktu ini."
          : `Maaf, unit tidak tersedia. Sisa ${avail.available} unit untuk rentang waktu ini.`,
        "UNAVAILABLE",
      );
    }

    // Harga SELALU dihitung di server (harga dari client diabaikan).
    const quote = computeQuote({
      pricePerHour: model.pricePerHour,
      pricePerDay: model.pricePerDay,
      start: input.start,
      end: input.end,
      quantity: input.quantity,
    });

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        return await tx.booking.create({
          data: {
            code: newBookingCode(),
            publicToken: newPublicToken(),
            customerName: input.customerName,
            customerPhone: input.customerPhone,
            customerEmail: input.customerEmail,
            notes: input.notes || null,
            modelId: model.id,
            quantity: input.quantity,
            startAt: input.start,
            endAt: input.end,
            status: "PENDING_PAYMENT",
            holdExpiresAt: provider.holdExpiresAt(input.start, now, settings),
            subtotal: quote.subtotal,
            totalAmount: quote.total,
            units: {
              create: Array.from({ length: input.quantity }, () => ({
                startAt: input.start,
                endAt: input.end,
              })),
            },
          },
        });
      } catch (e) {
        // tabrakan kode booking acak (sangat jarang) → coba lagi
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
        throw e;
      }
    }
    throw new AppError(500, "Gagal membuat kode booking unik.");
  }, TX_OPTS);

  const instruction = await provider.createPayment(booking, settings, prisma);
  return { booking, instruction };
}

// ---------------------------------------------------------------------------
// Pembayaran → PAID + invoice
// ---------------------------------------------------------------------------
function invoiceNumberFor(bookingId: number, at: Date) {
  const p = wibParts(at);
  return `INV-${p.year}${String(p.month).padStart(2, "0")}-${String(bookingId).padStart(5, "0")}`;
}

/**
 * Tandai booking PAID + buat invoice, di dalam transaction yang sudah ada.
 * Dipakai oleh konfirmasi manual (Fase 1) dan webhook gateway (Fase 2).
 */
export async function markBookingPaid(
  tx: Tx,
  bookingId: number,
  payment: {
    gateway: "MANUAL" | "MIDTRANS" | "XENDIT" | "TRIPAY";
    method: PaymentMethod;
    gatewayOrderId: string;
    amount: number;
    confirmedById?: number | null;
    note?: string | null;
    rawPayload?: Prisma.InputJsonValue;
  },
  now = new Date(),
) {
  await tx.payment.create({
    data: {
      bookingId,
      gateway: payment.gateway,
      method: payment.method,
      gatewayOrderId: payment.gatewayOrderId,
      amount: payment.amount,
      status: "PAID",
      paidAt: now,
      confirmedById: payment.confirmedById ?? null,
      note: payment.note ?? null,
      rawPayload: payment.rawPayload,
    },
  });
  const booking = await tx.booking.update({
    where: { id: bookingId },
    data: { status: "PAID", paidAt: now, holdExpiresAt: null, expiredAt: null },
  });
  const invoice = await tx.invoice.upsert({
    where: { bookingId },
    create: { bookingId, invoiceNumber: invoiceNumberFor(bookingId, now), issuedAt: now },
    update: {},
  });
  return { booking, invoice };
}

export async function confirmManualPayment(
  bookingId: number,
  method: PaymentMethod,
  note: string | null,
  staff: SessionUser,
  now = new Date(),
) {
  return prisma.$transaction(async (tx) => {
    const pre = await tx.booking.findUnique({ where: { id: bookingId }, select: { modelId: true } });
    if (!pre) throw new AppError(404, "Booking tidak ditemukan.");
    await lockModel(tx, pre.modelId);
    await lockBooking(tx, bookingId);
    const b = await tx.booking.findUniqueOrThrow({ where: { id: bookingId } });

    if (b.status === "PAID" || b.status === "IN_USE" || b.status === "COMPLETED") {
      throw new AppError(409, "Booking ini sudah lunas.", "ALREADY_PAID");
    }
    if (b.status === "CANCELLED") throw new AppError(409, "Booking sudah dibatalkan.");

    const holdLapsed = b.status === "EXPIRED" || (b.holdExpiresAt != null && b.holdExpiresAt <= now);
    if (holdLapsed) {
      // Pembayaran setelah hold lewat: aktifkan lagi hanya bila unit masih tersedia.
      if (b.endAt <= now) throw new AppError(409, "Jadwal sewa sudah lewat. Buat booking baru.");
      const avail = await getModelAvailability(tx, b.modelId, b.startAt, b.endAt, { now, excludeBookingId: b.id });
      if (avail.available < b.quantity) {
        throw new AppError(
          409,
          "Hold sudah lewat dan unit sudah dipesan orang lain. Tawarkan jadwal/unit lain atau refund.",
          "UNIT_TAKEN",
        );
      }
    }

    const res = await markBookingPaid(
      tx,
      b.id,
      {
        gateway: "MANUAL",
        method,
        gatewayOrderId: `MAN-${b.code}-${now.getTime()}`,
        amount: b.totalAmount,
        confirmedById: staff.id,
        note,
      },
      now,
    );
    await audit(tx, staff.id, "CONFIRM_PAYMENT", "booking", b.id, {
      code: b.code,
      method,
      amount: b.totalAmount,
      reactivated: holdLapsed,
    });
    return res;
  }, TX_OPTS);
}

export async function cancelBooking(bookingId: number, reason: string | null, staff: SessionUser, now = new Date()) {
  return prisma.$transaction(async (tx) => {
    await lockBooking(tx, bookingId);
    const b = await tx.booking.findUnique({ where: { id: bookingId } });
    if (!b) throw new AppError(404, "Booking tidak ditemukan.");
    if (!["PENDING_PAYMENT", "PAID", "EXPIRED"].includes(b.status)) {
      throw new AppError(409, "Booking yang sedang disewa / selesai tidak bisa dibatalkan.");
    }
    const updated = await tx.booking.update({
      where: { id: b.id },
      data: { status: "CANCELLED", cancelledAt: now, holdExpiresAt: null, notes: reason ? `Batal: ${reason}` : b.notes },
    });
    await audit(tx, staff.id, "CANCEL_BOOKING", "booking", b.id, { code: b.code, from: b.status, reason });
    return updated;
  }, TX_OPTS);
}

// ---------------------------------------------------------------------------
// Check-in di store
// ---------------------------------------------------------------------------
export const bookingDetailInclude = {
  model: true,
  units: { include: { unit: true }, orderBy: { id: "asc" } },
  payments: { include: { confirmedBy: { select: { name: true } } }, orderBy: { createdAt: "asc" } },
  invoice: true,
  rental: {
    include: { checkedInBy: { select: { name: true } }, checkedOutBy: { select: { name: true } } },
  },
} satisfies Prisma.BookingInclude;

export type BookingDetail = Prisma.BookingGetPayload<{ include: typeof bookingDetailInclude }>;

/** Unit siap serah: model sama, status AVAILABLE, tidak sedang dipakai booking IN_USE lain. */
export async function handoverCandidates(db: Tx, modelId: number) {
  const units = await db.bikeUnit.findMany({
    where: { modelId, status: "AVAILABLE" },
    orderBy: { serialNumber: "asc" },
    include: {
      bookingUnits: {
        where: { booking: { status: "IN_USE" } },
        select: { booking: { select: { code: true } } },
      },
    },
  });
  return units.map((u) => ({
    id: u.id,
    serialNumber: u.serialNumber,
    notes: u.notes,
    busyWith: u.bookingUnits[0]?.booking.code ?? null,
  }));
}

export function checkinWindow(b: { startAt: Date; endAt: Date }, earlyMinutes: number) {
  return { opensAt: new Date(b.startAt.getTime() - earlyMinutes * 60_000), closesAt: b.endAt };
}

export async function checkIn(
  input: { bookingId: number; unitIds: number[]; collateralType: CollateralType; collateralNote?: string | null },
  staff: SessionUser,
  now = new Date(),
) {
  const settings = await getSettings();
  return prisma.$transaction(async (tx) => {
    const pre = await tx.booking.findUnique({ where: { id: input.bookingId }, select: { modelId: true } });
    if (!pre) throw new AppError(404, "Booking tidak ditemukan.");
    await lockModel(tx, pre.modelId);
    await lockBooking(tx, input.bookingId);
    const b = await tx.booking.findUniqueOrThrow({
      where: { id: input.bookingId },
      include: { units: { orderBy: { id: "asc" } } },
    });

    if (b.status !== "PAID") {
      const msg: Record<string, string> = {
        PENDING_PAYMENT: "Booking belum dibayar. Konfirmasi pembayaran dulu.",
        IN_USE: "Booking ini sudah check-in.",
        COMPLETED: "QR ditolak: booking sudah selesai.",
        EXPIRED: "QR ditolak: booking sudah kedaluwarsa.",
        CANCELLED: "QR ditolak: booking sudah dibatalkan.",
      };
      throw new AppError(409, msg[b.status] ?? "Status booking tidak valid untuk check-in.");
    }
    const win = checkinWindow(b, settings.checkinEarlyMinutes);
    if (now < win.opensAt) {
      throw new AppError(409, `Belum waktunya ambil. Check-in dibuka ${settings.checkinEarlyMinutes} menit sebelum jadwal.`);
    }
    if (now > win.closesAt) throw new AppError(409, "Jadwal sewa sudah lewat; check-in tidak bisa dilakukan.");

    const unitIds = [...new Set(input.unitIds)];
    if (unitIds.length !== b.quantity) {
      throw new AppError(400, `Pilih tepat ${b.quantity} unit sesuai jumlah yang dipesan.`);
    }
    const candidates = await handoverCandidates(tx, b.modelId);
    for (const id of unitIds) {
      const c = candidates.find((x) => x.id === id);
      if (!c) throw new AppError(400, "Unit harus sesuai model yang dipesan dan berstatus siap (AVAILABLE).");
      if (c.busyWith) throw new AppError(409, `Unit ${c.serialNumber} masih dipakai booking ${c.busyWith}.`);
    }

    for (let i = 0; i < b.units.length; i++) {
      await tx.bookingUnit.update({ where: { id: b.units[i].id }, data: { unitId: unitIds[i] } });
    }
    await tx.rental.create({
      data: {
        bookingId: b.id,
        checkedInById: staff.id,
        checkedInAt: now,
        collateralType: input.collateralType,
        collateralNote: input.collateralNote || null,
      },
    });
    const updated = await tx.booking.update({ where: { id: b.id }, data: { status: "IN_USE" } });
    await audit(tx, staff.id, "CHECK_IN", "booking", b.id, {
      code: b.code,
      unitIds,
      collateralType: input.collateralType,
    });
    return updated;
  }, TX_OPTS);
}

// ---------------------------------------------------------------------------
// Check-out & denda
// ---------------------------------------------------------------------------
export async function previewCheckout(bookingId: number, now = new Date()) {
  const settings = await getSettings();
  const b = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!b) throw new AppError(404, "Booking tidak ditemukan.");
  const fee = computeLateFee({
    endAt: b.endAt,
    returnedAt: now,
    graceMinutes: settings.graceMinutes,
    feePerHour: settings.lateFeePerHour,
    quantity: b.quantity,
  });
  return { ...fee, graceMinutes: settings.graceMinutes, feePerHour: settings.lateFeePerHour, returnedAt: now };
}

export async function checkOut(
  input: {
    bookingId: number;
    damageFee: number;
    damageNote?: string | null;
    settlementMethod?: PaymentMethod | null;
    collateralReturned: boolean;
    maintenanceUnitIds?: number[];
  },
  staff: SessionUser,
  now = new Date(),
) {
  const settings = await getSettings();
  return prisma.$transaction(async (tx) => {
    await lockBooking(tx, input.bookingId);
    const b = await tx.booking.findUnique({
      where: { id: input.bookingId },
      include: { rental: true, units: true },
    });
    if (!b) throw new AppError(404, "Booking tidak ditemukan.");
    if (b.status !== "IN_USE" || !b.rental) throw new AppError(409, "Booking ini tidak sedang disewa.");

    const fee = computeLateFee({
      endAt: b.endAt,
      returnedAt: now,
      graceMinutes: settings.graceMinutes,
      feePerHour: settings.lateFeePerHour,
      quantity: b.quantity,
    });
    const damageFee = Math.max(0, Math.round(input.damageFee || 0));
    const extra = fee.lateFee + damageFee;
    if (extra > 0 && !input.settlementMethod) {
      throw new AppError(400, "Pilih metode pelunasan denda/kerusakan.");
    }
    if (!input.collateralReturned) {
      throw new AppError(400, "Pastikan jaminan sudah dikembalikan ke pelanggan.");
    }

    await tx.rental.update({
      where: { bookingId: b.id },
      data: {
        checkedOutById: staff.id,
        checkedOutAt: now,
        lateMinutes: fee.lateMinutes,
        lateFee: fee.lateFee,
        damageFee,
        damageNote: input.damageNote || null,
        settlementMethod: extra > 0 ? input.settlementMethod : null,
        collateralReturned: true,
      },
    });

    const assigned = new Set(b.units.map((u) => u.unitId).filter((x): x is number => x != null));
    const toMaintenance = (input.maintenanceUnitIds ?? []).filter((id) => assigned.has(id));
    if (toMaintenance.length) {
      await tx.bikeUnit.updateMany({
        where: { id: { in: toMaintenance } },
        data: { status: "MAINTENANCE", notes: input.damageNote ? `Rusak: ${input.damageNote}` : "Perlu dicek setelah sewa" },
      });
    }

    const updated = await tx.booking.update({ where: { id: b.id }, data: { status: "COMPLETED" } });
    await audit(tx, staff.id, "CHECK_OUT", "booking", b.id, {
      code: b.code,
      lateMinutes: fee.lateMinutes,
      lateFee: fee.lateFee,
      damageFee,
      maintenance: toMaintenance,
    });
    return updated;
  }, TX_OPTS);
}

// ---------------------------------------------------------------------------
// Armada: ubah status unit dengan pengaman booking aktif
// ---------------------------------------------------------------------------
export async function setUnitStatus(
  unitId: number,
  status: "AVAILABLE" | "MAINTENANCE" | "RETIRED",
  staff: SessionUser,
  now = new Date(),
) {
  return prisma.$transaction(async (tx) => {
    const unit = await tx.bikeUnit.findUnique({ where: { id: unitId } });
    if (!unit) throw new AppError(404, "Unit tidak ditemukan.");
    await lockModel(tx, unit.modelId);

    if (status !== "AVAILABLE" && unit.status === "AVAILABLE") {
      const inUse = await tx.bookingUnit.findFirst({
        where: { unitId, booking: { status: "IN_USE" } },
        include: { booking: { select: { code: true } } },
      });
      if (inUse) {
        throw new AppError(409, `Unit sedang disewa (booking ${inUse.booking.code}). Selesaikan check-out dulu.`);
      }
      // Pastikan sisa unit tetap cukup untuk semua booking aktif ke depan.
      const remaining = (await tx.bikeUnit.count({ where: { modelId: unit.modelId, status: "AVAILABLE" } })) - 1;
      const future = await tx.booking.findMany({
        where: { modelId: unit.modelId, endAt: { gt: now }, AND: [blockingWhere(now)] },
        select: { startAt: true, endAt: true, quantity: true },
      });
      if (future.length) {
        const until = new Date(Math.max(...future.map((f) => f.endAt.getTime())));
        const peak = peakUsage(
          future.map((f) => ({ start: f.startAt, end: f.endAt, qty: f.quantity })),
          now,
          until,
        );
        if (peak > remaining) {
          throw new AppError(
            409,
            `Ditolak: unit ini dibutuhkan untuk booking aktif (butuh ${peak} unit, tersisa ${remaining}). Pindahkan atau batalkan booking terkait dulu.`,
            "UNIT_NEEDED",
          );
        }
      }
    }

    const updated = await tx.bikeUnit.update({ where: { id: unitId }, data: { status } });
    await audit(tx, staff.id, "UNIT_STATUS", "bike_unit", unitId, { from: unit.status, to: status });
    return updated;
  }, TX_OPTS);
}
