// Fase 1 (AKTIF): pelanggan bayar di store (tunai / QRIS statis toko) atau transfer,
// lalu staf/admin menekan "Konfirmasi Bayar" di dashboard → PAID + invoice terbit.
import type { Booking } from "@prisma/client";
import { addMinutes } from "../time";
import { rupiah } from "../format";
import type { ManualInstruction, PaymentProvider } from "./types";
import type { Settings } from "../settings";

function instruction(booking: Booking, settings: Settings): ManualInstruction {
  return {
    mode: "MANUAL",
    amount: booking.totalAmount,
    holdExpiresAt: booking.holdExpiresAt?.toISOString() ?? null,
    bankInfo: settings.bankInfo,
    whatsappNumber: settings.whatsappNumber,
    whatsappText:
      `Halo Pleazure, saya mau konfirmasi pembayaran sewa sepeda.\n` +
      `Kode booking: ${booking.code}\nNama: ${booking.customerName}\nTotal: ${rupiah(booking.totalAmount)}\n` +
      `(bukti transfer terlampir)`,
  };
}

export const manualProvider: PaymentProvider = {
  mode: "MANUAL",
  holdExpiresAt(startAt, _now, settings) {
    // Belum bayar di muka → unit ditahan sampai jam mulai sewa + 30 menit (default).
    return addMinutes(startAt, settings.holdMinutesAfterStart);
  },
  async createPayment(booking, settings) {
    // Baris `payments` baru dibuat saat staf mengonfirmasi (lihat confirmManualPayment).
    return instruction(booking, settings);
  },
  async getInstruction(booking, settings) {
    return instruction(booking, settings);
  },
  async handleNotification() {
    return { status: 404, body: { error: "Payment gateway belum aktif (mode MANUAL)." } };
  },
};
