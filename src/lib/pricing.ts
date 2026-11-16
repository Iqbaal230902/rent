// SATU sumber logika harga & aturan waktu sewa — dipakai kalkulator (client)
// dan backend (/api/quote, /api/bookings). Jangan menduplikasi logika ini.
import { hhmmToMinutes, minutesOfDayWib } from "./time";

export type RentalRules = {
  openTime: string; // "07:00"
  closeTime: string; // "22:00"
  maxRentalDays: number;
  minRentalMinutes: number;
};

export type Quote = {
  durationMinutes: number;
  billableHours: number;
  days: number;
  remainderHours: number;
  hourlyCost: number; // biaya sisa jam (setelah cap harian)
  dailyApplied: boolean; // true bila tarif harian dipakai untuk sisa jam
  perUnit: number;
  quantity: number;
  subtotal: number;
  total: number;
  lines: { label: string; amount: number }[];
};

export function computeQuote(input: {
  pricePerHour: number;
  pricePerDay: number;
  start: Date;
  end: Date;
  quantity: number;
}): Quote {
  const { pricePerHour, pricePerDay, start, end } = input;
  const quantity = Math.max(1, Math.floor(input.quantity));
  const durationMinutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60_000));
  const billableHours = Math.max(1, Math.ceil(durationMinutes / 60));
  const days = Math.floor(billableHours / 24);
  const remainderHours = billableHours - days * 24;
  const rawHourly = remainderHours * pricePerHour;
  // Tarif harian berlaku otomatis bila total tarif per jam melebihi tarif harian.
  const dailyApplied = remainderHours > 0 && rawHourly > pricePerDay;
  const hourlyCost = dailyApplied ? pricePerDay : rawHourly;
  const perUnit = days * pricePerDay + hourlyCost;
  const subtotal = perUnit * quantity;

  const lines: Quote["lines"] = [];
  if (days > 0) lines.push({ label: `${days} hari × tarif harian`, amount: days * pricePerDay });
  if (remainderHours > 0) {
    lines.push({
      label: dailyApplied
        ? `${remainderHours} jam (dibulatkan ke tarif harian)`
        : `${remainderHours} jam × tarif per jam`,
      amount: hourlyCost,
    });
  }
  if (quantity > 1) lines.push({ label: `× ${quantity} unit`, amount: subtotal });

  return {
    durationMinutes,
    billableHours,
    days,
    remainderHours,
    hourlyCost,
    dailyApplied,
    perUnit,
    quantity,
    subtotal,
    total: subtotal,
    lines,
  };
}

/** Validasi rentang sewa. Mengembalikan pesan error (Bahasa Indonesia) atau null. */
export function validateRentalWindow(
  start: Date,
  end: Date,
  rules: RentalRules,
  now = new Date(),
): string | null {
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "Tanggal/jam tidak valid.";
  if (start.getTime() < now.getTime() - 5 * 60_000) return "Waktu mulai sudah lewat. Pilih waktu yang akan datang.";
  if (end.getTime() <= start.getTime()) return "Waktu selesai harus setelah waktu mulai.";
  const minutes = (end.getTime() - start.getTime()) / 60_000;
  if (minutes < rules.minRentalMinutes) return `Durasi sewa minimal ${Math.round(rules.minRentalMinutes / 60)} jam.`;
  if (minutes > rules.maxRentalDays * 24 * 60) return `Durasi sewa maksimal ${rules.maxRentalDays} hari.`;
  const open = hhmmToMinutes(rules.openTime);
  const close = hhmmToMinutes(rules.closeTime);
  const label = `${rules.openTime.replace(":", ".")}–${rules.closeTime.replace(":", ".")} WIB`;
  const s = minutesOfDayWib(start);
  const e = minutesOfDayWib(end);
  if (s < open || s > close) return `Jam ambil harus di dalam jam operasional ${label}.`;
  if (e < open || e > close) return `Jam kembali harus di dalam jam operasional ${label}.`;
  return null;
}

/** Denda = ceil((kembali − selesai − grace) / 1 jam) × denda per jam × jumlah unit, minimal 0. */
export function computeLateFee(input: {
  endAt: Date;
  returnedAt: Date;
  graceMinutes: number;
  feePerHour: number;
  quantity: number;
}) {
  const lateMinutes = Math.max(0, Math.floor((input.returnedAt.getTime() - input.endAt.getTime()) / 60_000));
  const billable = Math.max(0, lateMinutes - input.graceMinutes);
  const lateHours = Math.ceil(billable / 60);
  return { lateMinutes, lateHours, lateFee: lateHours * input.feePerHour * input.quantity };
}
