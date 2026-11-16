"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import type { PublicModel } from "@/lib/catalog";
import { CATEGORIES } from "@/lib/constants";
import { computeQuote, validateRentalWindow, type RentalRules } from "@/lib/pricing";
import { fmtDateTime, fmtDuration, rupiah } from "@/lib/format";
import { RentalWindowPicker, useRentalWindow, type WindowValue } from "./rental-window";
import { QtyStepper } from "./qty-stepper";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type ServerQuote = {
  availability: { available: number; totalUnits: number } | null;
  windowError: string | null;
};

export function BookingForm({
  model,
  rules,
  initialWindow,
  initialQty,
  todayDate,
  holdMinutes,
}: {
  model: PublicModel;
  rules: RentalRules;
  initialWindow: WindowValue;
  initialQty: number;
  todayDate: string;
  holdMinutes: number;
}) {
  const router = useRouter();
  const { value, setValue, start, end } = useRentalWindow(initialWindow);
  const [qty, setQty] = useState(initialQty);
  const [form, setForm] = useState({ customerName: "", customerPhone: "", customerEmail: "", notes: "" });
  const [agree, setAgree] = useState(false);
  const [server, setServer] = useState<ServerQuote | null>(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const windowError = useMemo(() => validateRentalWindow(start, end, rules), [start, end, rules]);
  const quote = windowError
    ? null
    : computeQuote({ pricePerHour: model.pricePerHour, pricePerDay: model.pricePerDay, start, end, quantity: qty });

  // Cek stok di server setiap rentang/jumlah berubah.
  const s = start.getTime();
  const e = end.getTime();
  useEffect(() => {
    if (windowError) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setChecking(true);
      try {
        const res = await fetch("/api/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ modelId: model.id, start: new Date(s).toISOString(), end: new Date(e).toISOString(), quantity: qty }),
          signal: ctrl.signal,
        });
        if (res.ok) setServer(await res.json());
      } catch {
        /* dibatalkan */
      } finally {
        if (!ctrl.signal.aborted) setChecking(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [s, e, qty, model.id, windowError]);

  const available = server?.availability?.available;
  const notEnough = available !== undefined && available < qty;
  const maxQty = Math.max(1, Math.min(10, available ?? 10));

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);
    if (windowError) return setError(windowError);
    if (!agree) return setError("Setujui syarat & ketentuan terlebih dahulu.");
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: model.id,
          quantity: qty,
          start: start.toISOString(),
          end: end.toISOString(),
          ...form,
          notes: form.notes || undefined,
          agree,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Booking gagal. Coba lagi.");
        if (res.status === 409) setServer((p) => (p ? { ...p, availability: p.availability && { ...p.availability, available: 0 } } : p));
        return;
      }
      router.push(data.statusUrl);
    } catch {
      setError("Koneksi bermasalah. Periksa internet Anda lalu coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  const c = CATEGORIES[model.category];

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
      <div className="grid gap-6">
        <section className="rounded-[28px] bg-white p-5 ring-1 ring-line shadow-pop sm:p-6">
          <StepTitle n={1} color={c.from}>Kapan mau gowes?</StepTitle>
          <RentalWindowPicker
            value={value}
            onChange={setValue}
            openTime={rules.openTime}
            closeTime={rules.closeTime}
            todayDate={todayDate}
            className="mt-4"
          />
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-cream p-4">
            <div>
              <p className="text-sm font-bold">Jumlah unit</p>
              <p className="text-sm text-muted">
                {windowError ? (
                  "Pilih rentang waktu yang valid"
                ) : checking && available === undefined ? (
                  "Mengecek stok…"
                ) : available === undefined ? (
                  "—"
                ) : available === 0 ? (
                  <span className="font-semibold text-rose-600">Habis di rentang ini — coba jam/tanggal lain</span>
                ) : (
                  <span className={cn("font-semibold", available <= 1 ? "text-amber-700" : "text-emerald-700")}>
                    Sisa {available} dari {server?.availability?.totalUnits} unit
                  </span>
                )}
              </p>
            </div>
            <QtyStepper value={qty} onChange={setQty} max={maxQty} />
          </div>
          {windowError && <Alert tone="warn" className="mt-4">{windowError}</Alert>}
        </section>

        <section className="rounded-[28px] bg-white p-5 ring-1 ring-line shadow-pop sm:p-6">
          <StepTitle n={2} color={c.to}>Data pemesan</StepTitle>
          <p className="mt-1 text-sm text-muted">Tanpa akun. Kami pakai data ini untuk invoice & konfirmasi.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Nama lengkap (sesuai E-KTP)" htmlFor="name" className="sm:col-span-2">
              <Input
                id="name"
                required
                autoComplete="name"
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                placeholder="mis. Rani Kusuma"
              />
            </Field>
            <Field label="Nomor WhatsApp" htmlFor="phone">
              <Input
                id="phone"
                required
                inputMode="tel"
                autoComplete="tel"
                value={form.customerPhone}
                onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                placeholder="0812xxxxxxx"
              />
            </Field>
            <Field label="Email" htmlFor="email">
              <Input
                id="email"
                required
                type="email"
                autoComplete="email"
                value={form.customerEmail}
                onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                placeholder="nama@email.com"
              />
            </Field>
            <Field label="Catatan (opsional)" htmlFor="notes" className="sm:col-span-2">
              <Textarea
                id="notes"
                maxLength={255}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="mis. tinggi badan 165 cm, butuh helm"
              />
            </Field>
          </div>
          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl bg-cream p-4 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 h-5 w-5 shrink-0 accent-violet"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            <span>
              Saya setuju dengan{" "}
              <Link href="/syarat" target="_blank" className="font-bold text-violet underline underline-offset-2">
                syarat & ketentuan
              </Link>
              , termasuk menitipkan E-KTP asli sebagai jaminan dan denda keterlambatan.
            </span>
          </label>
        </section>
      </div>

      <aside className="lg:sticky lg:top-24">
        <div className="overflow-hidden rounded-[28px] bg-ink text-white shadow-pop">
          <div className="relative p-6">
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-70 blur-2xl"
              style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
            />
            <p className="relative text-xs font-bold uppercase tracking-wider text-lime">Ringkasan</p>
            <p className="relative mt-1 font-display text-2xl font-extrabold">{model.name}</p>
            <p className="relative text-sm text-white/60">
              {c.label} · {qty} unit
            </p>
            <dl className="relative mt-5 space-y-3 text-sm">
              <div>
                <dt className="text-white/50">Ambil</dt>
                <dd className="font-semibold">{windowError ? "—" : fmtDateTime(start)}</dd>
              </div>
              <div>
                <dt className="text-white/50">Kembali</dt>
                <dd className="font-semibold">{windowError ? "—" : fmtDateTime(end)}</dd>
              </div>
              {quote && (
                <div>
                  <dt className="text-white/50">Durasi</dt>
                  <dd className="font-semibold">
                    {fmtDuration(quote.durationMinutes)} <span className="text-white/50">(ditagih {quote.billableHours} jam)</span>
                  </dd>
                </div>
              )}
            </dl>
            {quote && (
              <ul className="relative mt-5 space-y-2 border-t border-white/10 pt-4 text-sm">
                {quote.lines.map((l) => (
                  <li key={l.label} className="flex justify-between gap-3">
                    <span className="text-white/60">{l.label}</span>
                    <span>{rupiah(l.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="bg-white/5 p-6">
            <div className="flex items-end justify-between">
              <span className="text-sm text-white/60">Total bayar</span>
              <span className="font-display text-3xl font-extrabold">{quote ? rupiah(quote.total) : "—"}</span>
            </div>
            {error && (
              <p role="alert" className="mt-4 rounded-2xl bg-rose-500/15 p-3 text-sm font-medium text-rose-200 ring-1 ring-rose-400/30">
                {error}
              </p>
            )}
            <Button
              type="submit"
              size="lg"
              className="mt-5 w-full"
              loading={submitting}
              disabled={!!windowError || notEnough || submitting}
            >
              {notEnough ? "Unit tidak cukup" : "Booking & tahan unit"} {!notEnough && <ArrowRight className="h-5 w-5" />}
            </Button>
            <ul className="mt-5 space-y-2 text-xs text-white/60">
              <li className="flex gap-2">
                <Lock className="h-4 w-4 shrink-0 text-lime" /> Unit langsung ditahan sampai {holdMinutes} menit setelah jam ambil.
              </li>
              <li className="flex gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-lime" /> Bayar di store atau transfer — dikonfirmasi staf.
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-lime" /> Invoice ber-QR terbit otomatis setelah lunas.
              </li>
            </ul>
          </div>
        </div>
      </aside>
    </form>
  );
}

function StepTitle({ n, color, children }: { n: number; color: string; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-3 text-xl font-extrabold">
      <span className="grid h-8 w-8 place-items-center rounded-xl text-sm text-white" style={{ background: color }}>
        {n}
      </span>
      {children}
    </h2>
  );
}
