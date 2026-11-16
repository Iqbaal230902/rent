import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Banknote, Download, Landmark, MapPin, PartyPopper, QrCode, Store, TimerReset } from "lucide-react";
import { findBookingByToken, bookingTimeline } from "@/lib/views";
import { getSettings } from "@/lib/settings";
import { getPaymentProvider } from "@/lib/payment";
import { prisma } from "@/lib/db";
import { qrDataUrl, qrPayloadFor } from "@/lib/qr";
import { BUSINESS, CATEGORIES, paymentMethodLabel, waLink } from "@/lib/constants";
import { fmtDateTime, fmtDuration, rupiah } from "@/lib/format";
import { StatusBadge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { StatusTimeline } from "@/components/site/timeline";
import { Countdown, CopyButton, StatusAutoRefresh } from "@/components/site/status-live";
import { WhatsappIcon } from "@/components/site/social-icons";
import { BikeArt } from "@/components/site/bike-art";

export const metadata: Metadata = { title: "Status booking", robots: { index: false } };

export default async function BookingStatusPage({ params }: PageProps<"/booking/[token]">) {
  const { token } = await params;
  const b = await findBookingByToken(token);
  if (!b) notFound();

  const settings = await getSettings();
  const c = CATEGORIES[b.model.category];
  const instruction = b.status === "PENDING_PAYMENT" ? await getPaymentProvider().getInstruction(b, settings, prisma) : null;
  const hasInvoice = !!b.invoice && ["PAID", "IN_USE", "COMPLETED"].includes(b.status);
  const qr = hasInvoice && b.status !== "COMPLETED" ? await qrDataUrl(qrPayloadFor(b.code), 360) : null;
  const paid = b.payments.find((p) => p.status === "PAID");
  const durationMin = (b.endAt.getTime() - b.startAt.getTime()) / 60000;

  return (
    <div className="relative">
      <StatusAutoRefresh token={token} status={b.status} />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-50"
        style={{ background: `radial-gradient(60% 70% at 85% 0%, ${c.to}55, transparent), radial-gradient(50% 60% at 0% 10%, ${c.from}44, transparent)` }}
      />
      <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-6 sm:px-6">
        {/* Header booking */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-muted">Kode booking</p>
            <div className="mt-1 flex items-center gap-3">
              <h1 className="font-mono text-3xl font-extrabold tracking-wider sm:text-4xl">{b.code}</h1>
              <CopyButton text={b.code} />
            </div>
          </div>
          <StatusBadge status={b.status} className="px-3.5 py-1.5 text-sm" />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <div className="grid content-start gap-6">
            {/* ---------- MENUNGGU BAYAR ---------- */}
            {b.status === "PENDING_PAYMENT" && instruction?.mode === "MANUAL" && (
              <section className="overflow-hidden rounded-[28px] bg-white ring-1 ring-line shadow-pop">
                <div className="bg-brand p-6 text-white">
                  <p className="text-sm font-bold uppercase tracking-wider text-white/80">Langkah berikutnya</p>
                  <p className="mt-1 font-display text-3xl font-extrabold">Bayar {rupiah(b.totalAmount)}</p>
                  {b.holdExpiresAt && (
                    <p className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-2xl bg-white/15 px-3 py-2 text-sm">
                      <TimerReset className="h-4 w-4" /> Unit ditahan sampai {fmtDateTime(b.holdExpiresAt)} ·
                      sisa <Countdown to={b.holdExpiresAt.toISOString()} className="font-bold" />
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)] gap-4 p-5 sm:grid-cols-2 sm:p-6">
                  <div className="rounded-3xl bg-cream p-5">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-orange text-white">
                      <Store className="h-5 w-5" />
                    </span>
                    <p className="mt-3 font-display text-lg font-extrabold">Bayar di store</p>
                    <p className="mt-1 text-sm text-muted">
                      Tunai atau QRIS toko saat datang ke {BUSINESS.address}. Sebutkan kode booking ke staf.
                    </p>
                  </div>
                  <div className="rounded-3xl bg-cream p-5">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet text-white">
                      <Landmark className="h-5 w-5" />
                    </span>
                    <p className="mt-3 font-display text-lg font-extrabold">Transfer bank</p>
                    <p className="mt-1 break-words text-sm font-semibold">{instruction.bankInfo}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <CopyButton text={instruction.bankInfo.match(/\d{6,}/)?.[0] ?? instruction.bankInfo} label="Salin no. rek" />
                      <CopyButton text={String(b.totalAmount)} label="Salin nominal" />
                    </div>
                    <p className="mt-2 text-xs text-muted">Transfer tepat {rupiah(b.totalAmount)}, lalu kirim bukti via WhatsApp.</p>
                  </div>
                  <a
                    href={waLink(instruction.whatsappNumber, instruction.whatsappText)}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonClass("success", "lg", "h-auto min-h-13 whitespace-normal py-3 text-center sm:col-span-2")}
                  >
                    <WhatsappIcon className="h-5 w-5" /> Kirim bukti / konfirmasi via WhatsApp
                  </a>
                  <p className="text-center text-xs text-muted sm:col-span-2">
                    Halaman ini otomatis berubah menjadi invoice begitu staf mengonfirmasi pembayaran.
                  </p>
                </div>
              </section>
            )}

            {/* ---------- INVOICE ---------- */}
            {hasInvoice && (
              <section className="overflow-hidden rounded-[28px] bg-white ring-1 ring-line shadow-pop">
                <div className="flex h-2">
                  <span className="flex-1 bg-orange" />
                  <span className="flex-1 bg-pink" />
                  <span className="flex-1 bg-violet" />
                  <span className="flex-1 bg-lime" />
                </div>
                <div className="flex flex-wrap items-start justify-between gap-4 p-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted">Invoice</p>
                    <p className="font-display text-2xl font-extrabold">{b.invoice!.invoiceNumber}</p>
                    <p className="text-sm text-muted">Terbit {fmtDateTime(b.invoice!.issuedAt)}</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-extrabold text-emerald-700 ring-1 ring-emerald-300">
                    LUNAS
                  </span>
                </div>
                <div className="grid gap-6 px-6 pb-6 sm:grid-cols-[auto_1fr] sm:items-center">
                  {qr ? (
                    <div className="mx-auto rounded-3xl bg-white p-3 ring-4 ring-lime">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qr} alt={`QR booking ${b.code}`} className="h-52 w-52" />
                    </div>
                  ) : (
                    <div className="mx-auto grid h-52 w-52 place-items-center rounded-3xl bg-cream text-center text-sm text-muted">
                      <div>
                        <PartyPopper className="mx-auto h-10 w-10 text-pink" />
                        <p className="mt-2 font-semibold">Sewa selesai.
                          <br />
                          Terima kasih!
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="space-y-3">
                    {b.status === "PAID" && (
                      <p className="flex gap-2 rounded-2xl bg-lime/40 p-3 text-sm font-semibold">
                        <QrCode className="h-5 w-5 shrink-0" /> Tunjukkan QR ini + E-KTP asli ke staf saat mengambil sepeda.
                      </p>
                    )}
                    {b.status === "IN_USE" && (
                      <p className="flex gap-2 rounded-2xl bg-sky-100 p-3 text-sm font-semibold text-sky-900">
                        <ArrowRight className="h-5 w-5 shrink-0" /> Selamat gowes! Kembalikan sebelum {fmtDateTime(b.endAt)} (toleransi{" "}
                        {settings.graceMinutes} menit).
                      </p>
                    )}
                    <dl className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-muted">Dibayar via</dt>
                        <dd className="font-bold">{paymentMethodLabel(paid?.method)}</dd>
                      </div>
                      <div>
                        <dt className="text-muted">Total</dt>
                        <dd className="font-bold">{rupiah(b.totalAmount)}</dd>
                      </div>
                    </dl>
                    <a href={`/api/invoices/${token}/pdf`} className={buttonClass("ink", "md", "w-full sm:w-auto")}>
                      <Download className="h-4 w-4" /> Unduh PDF invoice
                    </a>
                  </div>
                </div>
                {b.rental?.checkedOutAt && (b.rental.lateFee > 0 || b.rental.damageFee > 0) && (
                  <div className="border-t border-dashed border-line px-6 py-4 text-sm">
                    <p className="font-bold">Biaya tambahan saat pengembalian</p>
                    {b.rental.lateFee > 0 && (
                      <p className="mt-1 flex justify-between text-muted">
                        <span>Denda terlambat ({b.rental.lateMinutes} menit)</span>
                        <span className="font-semibold text-ink">{rupiah(b.rental.lateFee)}</span>
                      </p>
                    )}
                    {b.rental.damageFee > 0 && (
                      <p className="mt-1 flex justify-between text-muted">
                        <span>Kerusakan{b.rental.damageNote ? ` — ${b.rental.damageNote}` : ""}</span>
                        <span className="font-semibold text-ink">{rupiah(b.rental.damageFee)}</span>
                      </p>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* ---------- EXPIRED / CANCELLED ---------- */}
            {(b.status === "EXPIRED" || b.status === "CANCELLED") && (
              <section className="rounded-[28px] bg-white p-8 text-center ring-1 ring-line shadow-pop">
                <TimerReset className="mx-auto h-12 w-12 text-muted" />
                <p className="mt-3 font-display text-2xl font-extrabold">
                  {b.status === "EXPIRED" ? "Booking kedaluwarsa" : "Booking dibatalkan"}
                </p>
                <p className="mx-auto mt-2 max-w-md text-muted">
                  {b.status === "EXPIRED"
                    ? "Pembayaran belum diterima sampai batas waktu, jadi unit sudah dilepas. Silakan booking ulang."
                    : "Booking ini sudah dibatalkan dan unit dilepas."}{" "}
                  Sudah terlanjur transfer? Hubungi kami via WhatsApp.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link href={`/sepeda/${b.model.slug}`} className={buttonClass("brand", "md")}>
                    Booking lagi
                  </Link>
                  <a
                    href={waLink(settings.whatsappNumber, `Halo Pleazure, soal booking ${b.code}…`)}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonClass("outline", "md")}
                  >
                    <WhatsappIcon className="h-4 w-4" /> WhatsApp
                  </a>
                </div>
              </section>
            )}

            <section className="rounded-[28px] bg-white p-6 ring-1 ring-line">
              <p className="font-display text-lg font-extrabold">Riwayat status</p>
              <div className="mt-5">
                <StatusTimeline steps={bookingTimeline(b)} />
              </div>
            </section>
          </div>

          {/* ---------- DETAIL SEWA ---------- */}
          <aside className="grid content-start gap-6">
            <section className="overflow-hidden rounded-[28px] bg-ink text-white shadow-pop">
              <div className="relative aspect-[3/2]" style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}>
                <div className="absolute inset-4 rounded-3xl bg-white/90">
                  <BikeArt category={b.model.category} withBackdrop={false} />
                </div>
              </div>
              <div className="p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-lime">{c.label}</p>
                <p className="font-display text-2xl font-extrabold">
                  {b.model.name} <span className="text-white/60">× {b.quantity}</span>
                </p>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-white/60">Ambil</dt>
                    <dd className="text-right font-semibold">{fmtDateTime(b.startAt)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-white/60">Kembali</dt>
                    <dd className="text-right font-semibold">{fmtDateTime(b.endAt)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-white/60">Durasi</dt>
                    <dd className="font-semibold">{fmtDuration(durationMin)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-white/60">Pemesan</dt>
                    <dd className="text-right font-semibold">{b.customerName}</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-t border-white/10 pt-3">
                    <dt className="text-white/60">Total</dt>
                    <dd className="font-display text-xl font-extrabold text-lime">{rupiah(b.totalAmount)}</dd>
                  </div>
                </dl>
              </div>
            </section>
            <section className="rounded-[28px] bg-white p-6 ring-1 ring-line">
              <p className="flex items-center gap-2 font-display text-lg font-extrabold">
                <MapPin className="h-5 w-5 text-pink" /> Ambil di store
              </p>
              <p className="mt-2 text-sm text-muted">{BUSINESS.address}</p>
              <p className="mt-1 flex items-center gap-2 text-sm text-muted">
                <Banknote className="h-4 w-4" /> Bawa E-KTP asli sebagai jaminan.
              </p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(BUSINESS.mapsQuery)}`}
                target="_blank"
                rel="noreferrer"
                className={buttonClass("outline", "sm", "mt-4")}
              >
                Petunjuk arah
              </a>
            </section>
            <p className="px-2 text-xs text-muted">
              Simpan link halaman ini. Kehilangan link? Buka <Link href="/cek-booking" className="font-semibold underline">Cek Booking</Link>{" "}
              dengan kode & nomor WhatsApp.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
