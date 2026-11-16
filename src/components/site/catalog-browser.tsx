"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import type { PublicModel } from "@/lib/catalog";
import { CATEGORIES, CATEGORY_ORDER, type Category } from "@/lib/constants";
import { computeQuote, validateRentalWindow, type RentalRules } from "@/lib/pricing";
import { fmtDuration, rupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BikeVisual } from "./bike-art";
import { RentalWindowPicker, useRentalWindow, windowToQuery, type WindowValue } from "./rental-window";
import { useAvailability } from "./use-availability";
import { Alert } from "@/components/ui/alert";

export function CatalogBrowser({
  models,
  rules,
  initialWindow,
  initialCategory,
  todayDate,
}: {
  models: PublicModel[];
  rules: RentalRules;
  initialWindow: WindowValue;
  initialCategory: Category | "ALL";
  todayDate: string;
}) {
  const { value, setValue, start, end } = useRentalWindow(initialWindow);
  const [cat, setCat] = useState<Category | "ALL">(initialCategory);
  const windowError = useMemo(() => validateRentalWindow(start, end, rules), [start, end, rules]);
  const { data: avail, loading } = useAvailability(start, end, !windowError);

  const shown = models.filter((m) => cat === "ALL" || m.category === cat);
  const durationMin = (end.getTime() - start.getTime()) / 60000;

  return (
    <div className="grid gap-6">
      <div className="rounded-[28px] bg-white/70 p-4 ring-1 ring-line backdrop-blur sm:p-5">
        <RentalWindowPicker
          value={value}
          onChange={setValue}
          openTime={rules.openTime}
          closeTime={rules.closeTime}
          todayDate={todayDate}
        />
        {windowError ? (
          <Alert tone="warn" className="mt-3">{windowError}</Alert>
        ) : (
          <p className="mt-3 flex items-center gap-2 text-sm text-muted">
            <Sparkles className="h-4 w-4 text-pink" />
            Durasi <b className="text-ink">{fmtDuration(durationMin)}</b> — stok di bawah dihitung real-time untuk rentang ini.
          </p>
        )}
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {(["ALL", ...CATEGORY_ORDER] as const).map((c) => {
          const active = cat === c;
          const meta = c === "ALL" ? null : CATEGORIES[c];
          return (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2.5 text-sm font-bold transition",
                active ? "text-white shadow-pop" : "bg-white text-ink ring-1 ring-inset ring-line hover:ring-ink/30",
              )}
              style={
                active
                  ? { backgroundImage: meta ? `linear-gradient(120deg, ${meta.from}, ${meta.to})` : "linear-gradient(120deg,#160f2e,#2a2147)" }
                  : undefined
              }
            >
              {c === "ALL" ? "Semua" : meta!.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((m) => {
          const a = avail?.[m.id];
          const quote = windowError
            ? null
            : computeQuote({ pricePerHour: m.pricePerHour, pricePerDay: m.pricePerDay, start, end, quantity: 1 });
          const soldOut = a ? a.available === 0 : false;
          const c = CATEGORIES[m.category];
          return (
            <article
              key={m.id}
              className="group relative flex flex-col overflow-hidden rounded-[28px] bg-white ring-1 ring-line shadow-pop transition hover:-translate-y-1 hover:shadow-[0_24px_48px_-20px_rgba(22,15,46,.35)]"
            >
              <div
                className="relative aspect-[3/2] overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${c.from}1f, ${c.to}33)` }}
              >
                <BikeVisual category={m.category} photos={m.photos} name={m.name} className="transition duration-500 group-hover:scale-105" />
                <span className={cn("absolute left-4 top-4 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset", c.chip)}>
                  {c.label}
                </span>
                <AvailabilityPill loading={loading && !a} available={a?.available} total={a?.totalUnits} disabled={!!windowError} />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-xl font-extrabold">{m.name}</h3>
                {m.frameSize && <p className="mt-0.5 text-sm text-muted">Ukuran {m.frameSize}</p>}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-cream px-3 py-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Per jam</p>
                    <p className="font-display text-lg font-extrabold">{rupiah(m.pricePerHour)}</p>
                  </div>
                  <div className="rounded-2xl bg-cream px-3 py-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Per hari</p>
                    <p className="font-display text-lg font-extrabold">{rupiah(m.pricePerDay)}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-end justify-between gap-3 border-t border-dashed border-line pt-4">
                  <div>
                    <p className="text-xs text-muted">Estimasi rentang ini</p>
                    <p className={cn("font-display text-xl font-extrabold", c.accent)}>{quote ? rupiah(quote.total) : "—"}</p>
                  </div>
                  <Link
                    href={`/sepeda/${m.slug}?${windowToQuery(value)}`}
                    aria-disabled={soldOut}
                    className={cn(
                      "inline-flex h-11 items-center gap-1.5 rounded-2xl px-4 text-sm font-bold transition",
                      soldOut ? "bg-zinc-100 text-zinc-500" : "bg-ink text-white hover:bg-ink-2",
                    )}
                  >
                    {soldOut ? "Lihat jadwal" : "Pilih"} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {shown.length === 0 && <p className="py-10 text-center text-muted">Belum ada sepeda di kategori ini.</p>}
    </div>
  );
}

export function AvailabilityPill({
  loading,
  available,
  total,
  disabled,
  className,
}: {
  loading?: boolean;
  available?: number;
  total?: number;
  disabled?: boolean;
  className?: string;
}) {
  const base = "absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-extrabold shadow-sm";
  if (disabled) return null;
  if (loading || available === undefined)
    return <span className={cn(base, "w-20 animate-pulse bg-white/80 text-transparent", className)}>…</span>;
  if (available === 0) return <span className={cn(base, "bg-rose-500 text-white", className)}>Habis</span>;
  return (
    <span className={cn(base, available <= 1 ? "bg-sun text-ink" : "bg-lime text-ink", className)}>
      Sisa {available}/{total} unit
    </span>
  );
}
