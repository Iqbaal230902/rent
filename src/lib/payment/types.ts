// Interface modul pembayaran (PRD Modul B).
// Alur booking hanya bergantung pada interface ini, jadi QRIS Dinamis (Fase 2)
// bisa diaktifkan lewat env PAYMENT_GATEWAY_ENABLED tanpa mengubah alur booking.
import type { Booking, Prisma } from "@prisma/client";
import type { Settings } from "../settings";

export type PaymentMode = "MANUAL" | "QRIS_DINAMIS";

export type ManualInstruction = {
  mode: "MANUAL";
  amount: number;
  holdExpiresAt: string | null;
  bankInfo: string;
  whatsappNumber: string;
  whatsappText: string;
};

export type QrisInstruction = {
  mode: "QRIS_DINAMIS";
  amount: number;
  holdExpiresAt: string | null;
  qrString: string;
  expiresAt: string;
};

export type PaymentInstruction = ManualInstruction | QrisInstruction;

export type NotificationResult = {
  status: number;
  body: Record<string, unknown>;
};

export interface PaymentProvider {
  readonly mode: PaymentMode;
  /** Batas waktu hold unit untuk booking baru. */
  holdExpiresAt(startAt: Date, now: Date, settings: Settings): Date;
  /** Dipanggil SETELAH transaksi booking commit. */
  createPayment(booking: Booking, settings: Settings, db: Prisma.TransactionClient): Promise<PaymentInstruction>;
  /** Instruksi bayar untuk ditampilkan ulang di halaman status. */
  getInstruction(booking: Booking, settings: Settings, db: Prisma.TransactionClient): Promise<PaymentInstruction>;
  /** Webhook dari payment gateway. Mode MANUAL tidak menerima webhook. */
  handleNotification(req: Request): Promise<NotificationResult>;
}
