"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Clock3 } from "lucide-react";
import { fromWib, hhmmToMinutes, timeSlots, toWibDateInput, toWibTimeInput, addMinutes } from "@/lib/time";
import { Select } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import type { WindowValue } from "@/lib/window";

export type { WindowValue };
export { windowToQuery } from "@/lib/window";

export function useRentalWindow(initial: WindowValue) {
  const [value, setValue] = useState<WindowValue>(initial);
  const start = useMemo(() => fromWib(value.startDate, value.startTime), [value.startDate, value.startTime]);
  const end = useMemo(() => fromWib(value.endDate, value.endTime), [value.endDate, value.endTime]);
  return { value, setValue, start, end };
}

export function RentalWindowPicker({
  value,
  onChange,
  openTime,
  closeTime,
  todayDate,
  compact,
  className,
}: {
  value: WindowValue;
  onChange: (v: WindowValue) => void;
  openTime: string;
  closeTime: string;
  todayDate: string;
  compact?: boolean;
  className?: string;
}) {
  const slots = useMemo(() => timeSlots(openTime, closeTime, 30), [openTime, closeTime]);

  const set = (patch: Partial<WindowValue>) => {
    const next = { ...value, ...patch };
    // jaga agar selesai >= mulai
    if (next.endDate < next.startDate) next.endDate = next.startDate;
    if (next.endDate === next.startDate && hhmmToMinutes(next.endTime) <= hhmmToMinutes(next.startTime)) {
      const after = slots.find((s) => hhmmToMinutes(s) >= hhmmToMinutes(next.startTime) + 60);
      if (after) next.endTime = after;
    }
    onChange(next);
  };

  const presets = [
    { label: "2 jam", hours: 2 },
    { label: "4 jam", hours: 4 },
    { label: "Seharian", full: true },
    { label: "24 jam", hours: 24 },
  ];

  const applyPreset = (p: (typeof presets)[number]) => {
    if (p.full) {
      onChange({ startDate: value.startDate, startTime: openTime, endDate: value.startDate, endTime: closeTime });
      return;
    }
    const s = fromWib(value.startDate, value.startTime);
    const e = addMinutes(s, (p.hours ?? 2) * 60);
    let endTime = toWibTimeInput(e);
    if (hhmmToMinutes(endTime) > hhmmToMinutes(closeTime)) endTime = closeTime;
    onChange({ ...value, endDate: toWibDateInput(e), endTime });
  };

  const box = "rounded-2xl bg-white p-3 ring-1 ring-inset ring-line";
  const dateCls =
    "h-11 w-full rounded-xl bg-cream/60 px-3 text-[15px] font-semibold text-ink ring-1 ring-inset ring-line focus:outline-none focus:ring-2 focus:ring-violet/60";

  return (
    <div className={cn("grid gap-3", className)}>
      <div className={cn("grid gap-3", compact ? "sm:grid-cols-2" : "sm:grid-cols-2")}>
        <div className={box}>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange">
            <CalendarDays className="h-3.5 w-3.5" /> Ambil
          </p>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input
              type="date"
              aria-label="Tanggal ambil"
              className={dateCls}
              min={todayDate}
              value={value.startDate}
              onChange={(e) => e.target.value && set({ startDate: e.target.value })}
            />
            <Select
              aria-label="Jam ambil"
              className="h-11 w-28 rounded-xl bg-cream/60 font-semibold"
              value={value.startTime}
              onChange={(e) => set({ startTime: e.target.value })}
            >
              {slots.map((s) => (
                <option key={s} value={s}>
                  {s.replace(":", ".")}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className={box}>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-violet">
            <Clock3 className="h-3.5 w-3.5" /> Kembali
          </p>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input
              type="date"
              aria-label="Tanggal kembali"
              className={dateCls}
              min={value.startDate}
              value={value.endDate}
              onChange={(e) => e.target.value && set({ endDate: e.target.value })}
            />
            <Select
              aria-label="Jam kembali"
              className="h-11 w-28 rounded-xl bg-cream/60 font-semibold"
              value={value.endTime}
              onChange={(e) => set({ endTime: e.target.value })}
            >
              {slots.map((s) => (
                <option key={s} value={s}>
                  {s.replace(":", ".")}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-muted">Cepat:</span>
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => applyPreset(p)}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-ink ring-1 ring-inset ring-line transition hover:bg-lime hover:ring-lime"
          >
            {p.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted">
          Jam operasional {openTime.replace(":", ".")}–{closeTime.replace(":", ".")} WIB
        </span>
      </div>
    </div>
  );
}
