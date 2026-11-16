"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Calculator } from "lucide-react";
import type { PublicModel } from "@/lib/catalog";
import { CATEGORIES } from "@/lib/constants";
import { computeQuote, validateRentalWindow, type RentalRules } from "@/lib/pricing";
import { fmtDuration, rupiah } from "@/lib/format";
import { RentalWindowPicker, useRentalWindow, windowToQuery, type WindowValue } from "./rental-window";
import { QtyStepper } from "./qty-stepper";
import { Field, Select } from "@/components/ui/field";
import { buttonClass } from "@/components/ui/button";
import { BikeArt } from "./bike-art";

// Kalkulator memakai computeQuote() yang SAMA dengan backend (lib/pricing.ts).
export function PriceCalculator({
  models,
  rules,
  initialWindow,
  todayDate,
}: {
  models: PublicModel[];
  rules: RentalRules;
  initialWindow: WindowValue;
  todayDate: string;
}) {
  const { value, setValue, start, end } = useRentalWindow(initialWindow);
  const [modelId, setModelId] = useState(models[0]?.id ?? 0);
  const [qty, setQty] = useState(1);
  const model = models.find((m) => m.id === modelId) ?? models[0];
  const error = useMemo(() => validateRentalWindow(start, end, rules), [start, end, rules]);
  const quote =
    model && !error ? computeQuote({ pricePerHour: model.pricePerHour, pricePerDay: model.pricePerDay, start, end, quantity: qty }) : null;

  if (!model) return null;
  const c = CATEGORIES[model.category];

  return (
    <div className="grid overflow-hidden rounded-[32px] bg-white ring-1 ring-line shadow-pop lg:grid-cols-[1.25fr_1fr]">
      <div className="grid content-start gap-5 p-5 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <Field label="Pilih sepeda" htmlFor="calc-model">
            <Select id="calc-model" value={modelId} onChange={(e) => setModelId(Number(e.target.value))}>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {CATEGORIES[m.category].label} — {m.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Jumlah unit">
            <QtyStepper value={qty} onChange={setQty} />
          </Field>
        </div>
        <RentalWindowPicker value={value} onChange={setValue} openTime={rules.openTime} closeTime={rules.closeTime} todayDate={todayDate} />
      </div>

      <div className="relative flex flex-col justify-between overflow-hidden bg-ink p-6 text-white sm:p-8">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-60 blur-3xl"
          style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
        />
        <div className="relative">
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-lime">
            <Calculator className="h-4 w-4" /> Estimasi biaya
          </p>
          <div className="mt-2 h-24 w-36 opacity-90">
            <BikeArt category={model.category} withBackdrop={false} className="[&_path]:stroke-white/90 [&_circle]:stroke-white/90" />
          </div>
          {error ? (
            <p className="mt-4 rounded-2xl bg-white/10 p-4 text-sm text-amber-200">{error}</p>
          ) : quote ? (
            <>
              <p className="mt-2 text-sm text-white/60">
                {model.name} · {fmtDuration(quote.durationMinutes)} · ditagih {quote.billableHours} jam
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {quote.lines.map((l) => (
                  <li key={l.label} className="flex justify-between gap-4 border-b border-white/10 pb-2">
                    <span className="text-white/70">{l.label}</span>
                    <span className="font-semibold">{rupiah(l.amount)}</span>
                  </li>
                ))}
              </ul>
              {quote.dailyApplied && (
                <p className="mt-3 inline-flex rounded-full bg-lime px-3 py-1 text-xs font-bold text-ink">
                  Hemat! Tarif harian otomatis dipakai
                </p>
              )}
            </>
          ) : null}
        </div>
        <div className="relative mt-6">
          <p className="text-sm text-white/60">Total</p>
          <p className="font-display text-4xl font-extrabold tracking-tight">{quote ? rupiah(quote.total) : "—"}</p>
          <Link
            href={`/sepeda/${model.slug}?${windowToQuery(value)}&q=${qty}`}
            className={buttonClass("lime", "lg", "mt-5 w-full")}
          >
            Lanjut booking <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
