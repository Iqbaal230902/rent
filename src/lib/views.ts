import type { BookingDetail } from "./booking";
import { prisma } from "./db";
import { bookingDetailInclude, expireHolds } from "./booking";

export type TimelineStep = { key: string; label: string; at: string | null; state: "done" | "current" | "todo" | "fail" };

export function bookingTimeline(b: BookingDetail): TimelineStep[] {
  const iso = (d?: Date | null) => (d ? d.toISOString() : null);
  const steps: TimelineStep[] = [
    { key: "PENDING_PAYMENT", label: "Booking dibuat", at: iso(b.createdAt), state: "done" },
    { key: "PAID", label: "Lunas · invoice terbit", at: iso(b.paidAt), state: b.paidAt ? "done" : "todo" },
    { key: "IN_USE", label: "Sepeda diambil", at: iso(b.rental?.checkedInAt), state: b.rental ? "done" : "todo" },
    {
      key: "COMPLETED",
      label: "Dikembalikan · selesai",
      at: iso(b.rental?.checkedOutAt),
      state: b.rental?.checkedOutAt ? "done" : "todo",
    },
  ];
  if (b.status === "EXPIRED" || b.status === "CANCELLED") {
    const idx = steps.findIndex((s) => s.state === "todo");
    steps.splice(idx, steps.length - idx, {
      key: b.status,
      label: b.status === "EXPIRED" ? "Kedaluwarsa (belum dibayar)" : "Dibatalkan",
      at: iso(b.status === "EXPIRED" ? b.expiredAt : b.cancelledAt),
      state: "fail",
    });
  } else {
    const firstTodo = steps.findIndex((s) => s.state === "todo");
    if (firstTodo > 0) steps[firstTodo].state = "current";
  }
  return steps;
}

/** Ambil booking via token publik; expire hold yang sudah lewat lebih dulu. */
export async function findBookingByToken(token: string) {
  if (!/^[a-f0-9]{32}$/.test(token)) return null;
  await expireHolds();
  return prisma.booking.findUnique({ where: { publicToken: token }, include: bookingDetailInclude });
}

export function publicBookingJson(b: BookingDetail) {
  return {
    code: b.code,
    status: b.status,
    model: { name: b.model.name, category: b.model.category },
    quantity: b.quantity,
    startAt: b.startAt.toISOString(),
    endAt: b.endAt.toISOString(),
    totalAmount: b.totalAmount,
    holdExpiresAt: b.holdExpiresAt?.toISOString() ?? null,
    paidAt: b.paidAt?.toISOString() ?? null,
    invoiceNumber: b.invoice?.invoiceNumber ?? null,
    timeline: bookingTimeline(b),
  };
}
