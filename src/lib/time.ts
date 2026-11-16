// Utilitas waktu WIB (UTC+7, tanpa DST). Aman dipakai di client & server.
export const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

export function wibParts(d: Date) {
  const t = new Date(d.getTime() + WIB_OFFSET_MS);
  return {
    year: t.getUTCFullYear(),
    month: t.getUTCMonth() + 1,
    day: t.getUTCDate(),
    hour: t.getUTCHours(),
    minute: t.getUTCMinutes(),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "2026-11-16" + "08:30" (WIB) → Date (UTC instant). */
export function fromWib(date: string, time: string): Date {
  return new Date(`${date}T${time}:00+07:00`);
}

export function toWibDateInput(d: Date): string {
  const p = wibParts(d);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export function toWibTimeInput(d: Date): string {
  const p = wibParts(d);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

export function minutesOfDayWib(d: Date): number {
  const p = wibParts(d);
  return p.hour * 60 + p.minute;
}

export function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

/** Awal hari (00:00 WIB) dari instant d, dalam UTC. */
export function startOfDayWib(d: Date): Date {
  return fromWib(toWibDateInput(d), "00:00");
}

export function addMinutes(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * 60_000);
}

/** Slot jam dalam rentang operasional, mis. 07:00 … 22:00 per 30 menit. */
export function timeSlots(open: string, close: string, step = 30): string[] {
  const out: string[] = [];
  for (let m = hhmmToMinutes(open); m <= hhmmToMinutes(close); m += step) {
    out.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
  }
  return out;
}

/** Saran rentang default: slot 30 menit berikutnya yang masih buka, durasi 3 jam. */
export function defaultWindow(open: string, close: string, now = new Date()) {
  const openM = hhmmToMinutes(open);
  const closeM = hhmmToMinutes(close);
  let date = toWibDateInput(now);
  let startM = Math.ceil((minutesOfDayWib(now) + 30) / 30) * 30;
  if (startM < openM) startM = openM;
  if (startM + 60 > closeM) {
    date = toWibDateInput(new Date(now.getTime() + 24 * 3600_000));
    startM = Math.max(openM, 8 * 60);
  }
  const endM = Math.min(startM + 180, closeM);
  const fmt = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
  return { startDate: date, startTime: fmt(startM), endDate: date, endTime: fmt(endM) };
}
