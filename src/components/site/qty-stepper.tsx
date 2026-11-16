"use client";

import { Minus, Plus } from "lucide-react";

export function QtyStepper({ value, onChange, max = 10 }: { value: number; onChange: (n: number) => void; max?: number }) {
  return (
    <div className="inline-flex h-12 items-center rounded-2xl bg-white ring-1 ring-inset ring-line">
      <button
        type="button"
        className="grid h-12 w-12 place-items-center rounded-l-2xl hover:bg-ink/5 disabled:opacity-40"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        aria-label="Kurangi unit"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-10 text-center font-display text-lg font-extrabold" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="grid h-12 w-12 place-items-center rounded-r-2xl hover:bg-ink/5 disabled:opacity-40"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Tambah unit"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
