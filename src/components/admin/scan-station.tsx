"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, CheckCircle2, Keyboard, RotateCcw, ScanLine, Undo2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Field, Input, Textarea } from "@/components/ui/field";
import { StatusBadge } from "@/components/ui/badge";
import { ConfirmPaymentPanel } from "./booking-actions";
import { api } from "@/lib/client-api";
import { CATEGORIES, COLLATERAL_TYPES, PAYMENT_METHODS, collateralLabel, type Category } from "@/lib/constants";
import { fmtDateTime, fmtDuration, rupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

type Lookup = {
  viaQr: boolean;
  rejection: string | null;
  booking: {
    id: number;
    code: string;
    status: string;
    customerName: string;
    customerPhone: string;
    modelName: string;
    category: Category;
    quantity: number;
    startAt: string;
    endAt: string;
    totalAmount: number;
    units: { id: number | null; serialNumber: string | null }[];
    rental: { collateralType: string; collateralNote: string | null; checkedInAt: string; checkedInBy: string } | null;
  };
  checkin: {
    opensAt: string;
    closesAt: string;
    open: boolean;
    candidates: { id: number; serialNumber: string; notes: string | null; busyWith: string | null }[];
  };
  checkout: { lateMinutes: number; lateHours: number; lateFee: number; graceMinutes: number; feePerHour: number } | null;
};

const SCANNER_ID = "qr-reader";

export function ScanStation({ initialQuery }: { initialQuery?: string }) {
  const [manual, setManual] = useState(initialQuery ?? "");
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<{ title: string; body: string } | null>(null);
  const [camOn, setCamOn] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
  const lastQuery = useRef<string>("");

  const runLookup = useCallback(async (q: string) => {
    const query = q.trim();
    if (!query) return;
    lastQuery.current = query;
    setLoading(true);
    setError(null);
    setDone(null);
    const r = await api<Lookup>(`/api/admin/bookings/lookup?q=${encodeURIComponent(query)}`);
    setLoading(false);
    if (!r.ok) {
      setLookup(null);
      setError(r.error);
      return;
    }
    setLookup(r.data);
  }, []);

  const stopCamera = useCallback(async () => {
    const s = scannerRef.current;
    scannerRef.current = null;
    setCamOn(false);
    if (s) {
      try {
        await s.stop();
        s.clear();
      } catch {
        /* sudah berhenti */
      }
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCamError(null);
    setCamOn(true);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(SCANNER_ID, { verbose: false });
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: (w: number, h: number) => ({ width: Math.min(w, h) * 0.7, height: Math.min(w, h) * 0.7 }) },
        (text: string) => {
          if (navigator.vibrate) navigator.vibrate(80);
          void stopCamera();
          void runLookup(text);
        },
        () => {},
      );
    } catch (e) {
      scannerRef.current = null;
      setCamOn(false);
      setCamError(
        e instanceof Error && /permission|notallowed/i.test(e.message)
          ? "Akses kamera ditolak. Izinkan kamera di browser, atau ketik kode booking."
          : "Kamera tidak bisa dibuka (butuh HTTPS / kamera tidak tersedia). Gunakan input kode manual.",
      );
    }
  }, [runLookup, stopCamera]);

  useEffect(() => {
    const t = initialQuery ? setTimeout(() => void runLookup(initialQuery), 0) : undefined;
    return () => {
      clearTimeout(t);
      void stopCamera();
    };
  }, [initialQuery, runLookup, stopCamera]);

  const reset = () => {
    setLookup(null);
    setError(null);
    setDone(null);
    setManual("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr] lg:items-start">
      {/* Kamera + input manual */}
      <section className="overflow-hidden rounded-3xl bg-ink text-white shadow-pop">
        <div className="relative aspect-square bg-black/40">
          <div id={SCANNER_ID} className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />
          {!camOn && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              <div>
                <div className="mx-auto grid h-24 w-24 place-items-center rounded-[28px] bg-brand">
                  <ScanLine className="h-12 w-12" />
                </div>
                <p className="mt-4 font-display text-xl font-extrabold">Scan QR invoice</p>
                <p className="mt-1 text-sm text-white/60">Arahkan kamera belakang ke QR pelanggan.</p>
                <Button variant="lime" size="lg" className="mt-5" onClick={startCamera}>
                  <Camera className="h-5 w-5" /> Nyalakan kamera
                </Button>
              </div>
            </div>
          )}
          {camOn && (
            <button
              onClick={stopCamera}
              className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-xl bg-black/60 px-3 py-2 text-xs font-bold"
            >
              <CameraOff className="h-4 w-4" /> Matikan
            </button>
          )}
        </div>
        <form
          className="grid gap-2 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            void runLookup(manual);
          }}
        >
          <label htmlFor="manual-code" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/60">
            <Keyboard className="h-4 w-4" /> Cadangan: ketik kode booking
          </label>
          <div className="flex gap-2">
            <input
              id="manual-code"
              value={manual}
              onChange={(e) => setManual(e.target.value.toUpperCase())}
              placeholder="PLZ-XXXXXX"
              className="h-12 min-w-0 flex-1 rounded-2xl bg-white/10 px-4 font-mono text-lg font-bold tracking-wider text-white placeholder:text-white/30 ring-1 ring-inset ring-white/15 focus:outline-none focus:ring-2 focus:ring-lime"
            />
            <Button type="submit" variant="lime" size="lg" loading={loading} className="h-12">
              Cari
            </Button>
          </div>
          {camError && <p className="text-sm text-amber-300">{camError}</p>}
        </form>
      </section>

      {/* Hasil */}
      <section className="grid content-start gap-4">
        {!lookup && !error && !done && (
          <div className="grid place-items-center rounded-3xl border-2 border-dashed border-line bg-white/60 px-6 py-16 text-center text-muted">
            <ScanLine className="h-10 w-10" />
            <p className="mt-3 font-semibold">Hasil scan muncul di sini.</p>
            <p className="text-sm">Check-in untuk booking LUNAS, check-out untuk sepeda yang sedang disewa.</p>
          </div>
        )}
        {error && (
          <div className="rounded-3xl bg-rose-50 p-6 ring-2 ring-rose-300">
            <XCircle className="h-10 w-10 text-rose-600" />
            <p className="mt-3 font-display text-xl font-extrabold text-rose-800">{error}</p>
            <Button variant="outline" className="mt-4" onClick={reset}>
              <RotateCcw className="h-4 w-4" /> Scan ulang
            </Button>
          </div>
        )}
        {done && (
          <div className="rounded-3xl bg-emerald-50 p-6 ring-2 ring-emerald-300">
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
            <p className="mt-3 font-display text-2xl font-extrabold text-emerald-900">{done.title}</p>
            <p className="mt-1 text-emerald-900/80">{done.body}</p>
            <Button variant="ink" size="lg" className="mt-5" onClick={reset}>
              <ScanLine className="h-5 w-5" /> Scan berikutnya
            </Button>
          </div>
        )}
        {lookup && !done && (
          <>
            <BookingSummary l={lookup} />
            {lookup.rejection && (
              <div className="rounded-3xl bg-rose-50 p-5 ring-2 ring-rose-300">
                <p className="flex items-center gap-2 font-display text-xl font-extrabold text-rose-800">
                  <XCircle className="h-6 w-6" /> {lookup.rejection}
                </p>
              </div>
            )}
            {lookup.booking.status === "PENDING_PAYMENT" && (
              <div className="rounded-3xl bg-white p-5 ring-2 ring-amber-300 shadow-pop">
                <p className="font-display text-lg font-extrabold">Belum dibayar</p>
                <p className="mb-4 text-sm text-muted">Terima pembayaran di kasir, konfirmasi, lalu lanjut check-in.</p>
                <ConfirmPaymentPanel
                  bookingId={lookup.booking.id}
                  amount={lookup.booking.totalAmount}
                  onDone={() => void runLookup(lastQuery.current)}
                />
              </div>
            )}
            {lookup.booking.status === "PAID" && (
              <CheckinForm
                l={lookup}
                onDone={(serials) =>
                  setDone({
                    title: "Check-in berhasil",
                    body: `Serahkan unit ${serials.join(", ")} ke ${lookup.booking.customerName}. Status → Sedang Disewa.`,
                  })
                }
              />
            )}
            {lookup.booking.status === "IN_USE" && lookup.checkout && (
              <CheckoutForm
                l={lookup}
                onDone={(total) =>
                  setDone({
                    title: "Sewa selesai",
                    body: `${total > 0 ? `Tambahan ${rupiah(total)} sudah dilunasi. ` : ""}Jaminan dikembalikan. Status → Selesai.`,
                  })
                }
              />
            )}
          </>
        )}
      </section>
    </div>
  );
}

function BookingSummary({ l }: { l: Lookup }) {
  const b = l.booking;
  const c = CATEGORIES[b.category];
  return (
    <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-line shadow-pop">
      <div className="h-2" style={{ background: `linear-gradient(90deg, ${c.from}, ${c.to})` }} />
      <div className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-2xl font-extrabold tracking-wider">{b.code}</p>
          <StatusBadge status={b.status} className="px-3 py-1.5 text-sm" />
        </div>
        {l.viaQr && <p className="mt-1 text-xs font-bold text-emerald-600">✓ QR terverifikasi (tanda tangan valid)</p>}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-muted">Pelanggan</p>
            <p className="text-lg font-bold">{b.customerName}</p>
            <p className="text-sm text-muted">{b.customerPhone}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted">Sepeda</p>
            <p className="text-lg font-bold">
              {b.modelName} × {b.quantity}
            </p>
            <p className={cn("text-sm font-semibold", c.accent)}>{c.label}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted">Ambil</p>
            <p className="font-semibold">{fmtDateTime(b.startAt)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted">Kembali</p>
            <p className="font-semibold">{fmtDateTime(b.endAt)}</p>
          </div>
        </div>
        {b.rental && (
          <p className="mt-4 rounded-2xl bg-cream p-3 text-sm">
            Jaminan: <b>{collateralLabel(b.rental.collateralType)}</b>
            {b.rental.collateralNote ? ` (${b.rental.collateralNote})` : ""} · Unit:{" "}
            <b className="font-mono">{b.units.map((u) => u.serialNumber).join(", ")}</b> · check-in {fmtDateTime(b.rental.checkedInAt)} oleh{" "}
            {b.rental.checkedInBy}
          </p>
        )}
      </div>
    </div>
  );
}

function CheckinForm({ l, onDone }: { l: Lookup; onDone: (serials: string[]) => void }) {
  const qty = l.booking.quantity;
  const [selected, setSelected] = useState<number[]>([]);
  const [collateral, setCollateral] = useState("KTP");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: number) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= qty ? [...s.slice(1), id] : [...s, id]));

  return (
    <div className="rounded-3xl bg-white p-5 ring-2 ring-emerald-300 shadow-pop">
      <p className="font-display text-xl font-extrabold">Check-in & serah unit</p>
      {!l.checkin.open && (
        <Alert tone="warn" className="mt-3">
          Di luar jendela pengambilan ({fmtDateTime(l.checkin.opensAt)} – {fmtDateTime(l.checkin.closesAt)}). Check-in akan ditolak.
        </Alert>
      )}
      <p className="mt-4 text-sm font-bold">
        Pilih {qty} unit <span className="text-muted">({selected.length}/{qty})</span>
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {l.checkin.candidates.map((u) => {
          const on = selected.includes(u.id);
          return (
            <button
              key={u.id}
              type="button"
              disabled={!!u.busyWith}
              onClick={() => toggle(u.id)}
              className={cn(
                "rounded-2xl p-3 text-left ring-2 ring-inset transition disabled:cursor-not-allowed disabled:opacity-40",
                on ? "bg-lime ring-ink" : "bg-cream ring-transparent hover:ring-line",
              )}
            >
              <p className="font-mono text-sm font-extrabold">{u.serialNumber}</p>
              <p className="text-xs text-muted">{u.busyWith ? `Dipakai ${u.busyWith}` : u.notes || "Siap"}</p>
            </button>
          );
        })}
        {l.checkin.candidates.length === 0 && (
          <p className="col-span-full text-sm text-rose-600">Tidak ada unit model ini yang berstatus siap.</p>
        )}
      </div>
      <p className="mt-5 text-sm font-bold">Jaminan</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {COLLATERAL_TYPES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCollateral(c.value)}
            className={cn(
              "rounded-2xl py-3 text-sm font-bold ring-1 ring-inset",
              collateral === c.value ? "bg-ink text-white ring-ink" : "bg-white ring-line",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
      <Input className="mt-3 h-11" placeholder="Catatan jaminan (opsional, jangan tulis NIK)" value={note} onChange={(e) => setNote(e.target.value)} />
      {error && <Alert tone="error" className="mt-3">{error}</Alert>}
      <Button
        variant="success"
        size="lg"
        className="mt-4 w-full"
        loading={loading}
        disabled={selected.length !== qty}
        onClick={async () => {
          setLoading(true);
          setError(null);
          const r = await api("/api/admin/checkin", {
            body: { bookingId: l.booking.id, unitIds: selected, collateralType: collateral, collateralNote: note || undefined },
          });
          setLoading(false);
          if (!r.ok) return setError(r.error);
          onDone(l.checkin.candidates.filter((c) => selected.includes(c.id)).map((c) => c.serialNumber));
        }}
      >
        <CheckCircle2 className="h-5 w-5" /> Check-in & serahkan
      </Button>
    </div>
  );
}

function CheckoutForm({ l, onDone }: { l: Lookup; onDone: (extra: number) => void }) {
  const co = l.checkout!;
  const [damageFee, setDamageFee] = useState("");
  const [damageNote, setDamageNote] = useState("");
  const [method, setMethod] = useState<string>("TUNAI");
  const [returned, setReturned] = useState(false);
  const [maint, setMaint] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dmg = Math.max(0, Number(damageFee.replace(/\D/g, "")) || 0);
  const extra = co.lateFee + dmg;
  const units = l.booking.units.filter((u): u is { id: number; serialNumber: string } => u.id != null && !!u.serialNumber);

  return (
    <div className="rounded-3xl bg-white p-5 ring-2 ring-violet/40 shadow-pop">
      <p className="flex items-center gap-2 font-display text-xl font-extrabold">
        <Undo2 className="h-5 w-5 text-violet" /> Check-out & denda
      </p>
      <div className={cn("mt-4 rounded-2xl p-4", co.lateFee > 0 ? "bg-rose-50 ring-1 ring-rose-200" : "bg-emerald-50 ring-1 ring-emerald-200")}>
        <p className="text-sm font-semibold">
          {co.lateMinutes > 0 ? `Terlambat ${fmtDuration(co.lateMinutes)}` : "Tepat waktu 🎉"}
          <span className="text-muted"> · toleransi {co.graceMinutes} menit</span>
        </p>
        <p className="mt-1 text-sm text-muted">
          {co.lateHours > 0
            ? `${co.lateHours} jam × ${rupiah(co.feePerHour)} × ${l.booking.quantity} unit`
            : "Tidak ada denda keterlambatan"}
        </p>
        <p className="mt-1 font-display text-2xl font-extrabold">{rupiah(co.lateFee)}</p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Biaya kerusakan (Rp)">
          <Input inputMode="numeric" placeholder="0" value={damageFee} onChange={(e) => setDamageFee(e.target.value)} className="h-11" />
        </Field>
        <Field label="Catatan kerusakan">
          <Textarea className="min-h-11 py-2.5" rows={1} value={damageNote} onChange={(e) => setDamageNote(e.target.value)} placeholder="mis. ban bocor" />
        </Field>
      </div>
      {units.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-bold">Tandai unit perlu maintenance</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {units.map((u) => (
              <label key={u.id} className="flex cursor-pointer items-center gap-2 rounded-xl bg-cream px-3 py-2 text-sm font-mono font-bold">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-amber-500"
                  checked={maint.includes(u.id)}
                  onChange={(e) => setMaint((m) => (e.target.checked ? [...m, u.id] : m.filter((x) => x !== u.id)))}
                />
                {u.serialNumber}
              </label>
            ))}
          </div>
        </div>
      )}
      {extra > 0 && (
        <div className="mt-4">
          <p className="text-sm font-bold">Pelunasan di tempat</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMethod(m.value)}
                className={cn(
                  "rounded-2xl px-2 py-3 text-xs font-bold ring-1 ring-inset",
                  method === m.value ? "bg-ink text-white ring-ink" : "bg-white ring-line",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl bg-lime/40 p-4 font-semibold">
        <input type="checkbox" className="h-5 w-5 accent-violet" checked={returned} onChange={(e) => setReturned(e.target.checked)} />
        Jaminan ({collateralLabel(l.booking.rental?.collateralType)}) sudah dikembalikan
      </label>
      <div className="mt-4 flex items-end justify-between rounded-2xl bg-ink p-4 text-white">
        <span className="text-sm text-white/70">Total tagihan tambahan</span>
        <span className="font-display text-2xl font-extrabold text-lime">{rupiah(extra)}</span>
      </div>
      {error && <Alert tone="error" className="mt-3">{error}</Alert>}
      <Button
        variant="brand"
        size="lg"
        className="mt-4 w-full"
        loading={loading}
        disabled={!returned}
        onClick={async () => {
          setLoading(true);
          setError(null);
          const r = await api("/api/admin/checkout", {
            body: {
              bookingId: l.booking.id,
              damageFee: dmg,
              damageNote: damageNote || undefined,
              settlementMethod: extra > 0 ? method : null,
              collateralReturned: returned,
              maintenanceUnitIds: maint,
            },
          });
          setLoading(false);
          if (!r.ok) return setError(r.error);
          onDone(extra);
        }}
      >
        <CheckCircle2 className="h-5 w-5" /> Selesai sewa
      </Button>
    </div>
  );
}
