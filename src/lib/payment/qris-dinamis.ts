// ============================================================================
// Fase 2 — QRIS DINAMIS via payment gateway (DITUNDA)
// ----------------------------------------------------------------------------
// Modul ini TIDAK dipakai selama PAYMENT_GATEWAY_ENABLED !== "true".
// Kerangkanya sudah sesuai interface PaymentProvider agar nanti cukup:
//   1. Pilih gateway (Midtrans / Xendit / Tripay) & isi PAYMENT_GATEWAY_SERVER_KEY.
//   2. Lengkapi TODO di bawah (panggil API gateway & verifikasi signature).
//   3. Set PAYMENT_GATEWAY_ENABLED="true" → alur booking otomatis memakai QRIS.
// ============================================================================
import type { PaymentProvider } from "./types";
import { addMinutes } from "../time";

const QRIS_HOLD_MINUTES = 15;

export const qrisDinamisProvider: PaymentProvider = {
  mode: "QRIS_DINAMIS",

  holdExpiresAt(startAt, now) {
    // Saat QRIS aktif: hold 15 menit (countdown), tapi tidak melewati jam mulai sewa.
    const h = addMinutes(now, QRIS_HOLD_MINUTES);
    return h < startAt ? h : startAt;
  },

  async createPayment(booking) {
    // TODO(Fase 2):
    // const res = await gateway.createQris({
    //   orderId: `${booking.code}-${Date.now()}`,
    //   amount: booking.totalAmount,          // nominal SELALU dari server
    //   expiryMinutes: QRIS_HOLD_MINUTES,
    // });
    // await db.payment.create({ data: {
    //   bookingId: booking.id, gateway: "MIDTRANS", method: "QRIS_DINAMIS",
    //   gatewayOrderId: res.orderId, qrString: res.qrString, amount: booking.totalAmount,
    // }});
    // return { mode: "QRIS_DINAMIS", amount: booking.totalAmount, qrString: res.qrString,
    //          expiresAt: res.expiresAt, holdExpiresAt: booking.holdExpiresAt?.toISOString() ?? null };
    void booking;
    throw new Error("QRIS Dinamis belum diaktifkan (Fase 2).");
  },

  async getInstruction(booking) {
    // TODO(Fase 2): ambil payment PENDING terakhir & kembalikan qrString + expiresAt.
    void booking;
    throw new Error("QRIS Dinamis belum diaktifkan (Fase 2).");
  },

  async handleNotification(req) {
    // TODO(Fase 2) — alur webhook (PRD bagian 7):
    // 1. Verifikasi signature/callback token; tolak (401) bila tidak valid.
    // 2. Simpan ke webhook_events; bila event_id sudah ada → balas 200 (idempoten).
    // 3. Cocokkan gateway_order_id & nominal; double-check status ke API gateway.
    // 4. PAID/SETTLEMENT & booking masih PENDING_PAYMENT → dalam 1 transaction:
    //    payment PAID, booking PAID, buat invoice (pakai markBookingPaid() di lib/booking.ts).
    //    Bila booking sudah EXPIRED → tandai "perlu tinjauan" untuk admin.
    // 5. Setelah commit: kirim email/WA via antrean agar webhook cepat membalas 200.
    void req;
    return { status: 501, body: { error: "Webhook QRIS Dinamis belum diimplementasikan." } };
  },
};
