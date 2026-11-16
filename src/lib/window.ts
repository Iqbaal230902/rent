// Rentang sewa dalam format input (tanggal & jam WIB). Aman untuk client & server.
export type WindowValue = { startDate: string; startTime: string; endDate: string; endTime: string };

export function windowToQuery(v: WindowValue) {
  return new URLSearchParams({ sd: v.startDate, st: v.startTime, ed: v.endDate, et: v.endTime }).toString();
}

export function windowFromQuery(
  sp: Record<string, string | string[] | undefined>,
  fallback: WindowValue,
): WindowValue {
  const g = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const date = /^\d{4}-\d{2}-\d{2}$/;
  const time = /^\d{2}:\d{2}$/;
  const sd = g("sd"), st = g("st"), ed = g("ed"), et = g("et");
  if (sd && st && ed && et && date.test(sd) && date.test(ed) && time.test(st) && time.test(et)) {
    return { startDate: sd, startTime: st, endDate: ed, endTime: et };
  }
  return fallback;
}
