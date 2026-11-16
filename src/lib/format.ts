// Aman dipakai di client & server.
const TZ = "Asia/Jakarta";

export function rupiah(n: number): string {
  return "Rp " + new Intl.NumberFormat("id-ID").format(Math.round(n));
}

export function fmtDateTime(d: Date | string): string {
  return (
    new Intl.DateTimeFormat("id-ID", {
      timeZone: TZ,
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(d)) + " WIB"
  );
}

export function fmtDate(d: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(d));
}

export function fmtShortDate(d: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
  }).format(new Date(d));
}

export function fmtTime(d: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}

export function fmtDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  const mm = m % 60;
  const parts: string[] = [];
  if (d) parts.push(`${d} hari`);
  if (h) parts.push(`${h} jam`);
  if (mm || parts.length === 0) parts.push(`${mm} menit`);
  return parts.join(" ");
}
