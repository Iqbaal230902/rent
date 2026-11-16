"use client";

import { useEffect, useState } from "react";

export type AvailMap = Record<number, { totalUnits: number; available: number }>;

/** Ambil stok real-time semua model untuk rentang waktu (debounce 250 ms). */
export function useAvailability(start: Date, end: Date, enabled: boolean) {
  const [data, setData] = useState<AvailMap | null>(null);
  const [loading, setLoading] = useState(false);
  const s = start.getTime();
  const e = end.getTime();

  useEffect(() => {
    if (!enabled || !(e > s)) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({ start: new Date(s).toISOString(), end: new Date(e).toISOString() });
        const res = await fetch(`/api/availability?${qs}`, { signal: ctrl.signal, cache: "no-store" });
        if (res.ok) setData((await res.json()).availability);
      } catch {
        /* dibatalkan */
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [s, e, enabled]);

  return { data, loading };
}
