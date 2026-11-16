import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink, FileDown, Mail, Phone, ScanLine } from "lucide-react";
import { prisma } from "@/lib/db";
import { bookingDetailInclude, expireHolds } from "@/lib/booking";
import { bookingTimeline } from "@/lib/views";
import { CATEGORIES, collateralLabel, paymentMethodLabel, waLink } from "@/lib/constants";
import { fmtDateTime, fmtDuration, rupiah } from "@/lib/format";
import { StatusBadge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { StatusTimeline } from "@/components/site/timeline";
import { CancelBookingButton, ConfirmPaymentPanel } from "@/components/admin/booking-actions";
import { WhatsappIcon } from "@/components/site/social-icons";

export const metadata: Metadata = { title: "Detail booking" };

export default async function BookingDetailPage({ params }: PageProps<"/admin/booking/[id]">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  await expireHolds();
  const b = await prisma.booking.findUnique({ where: { id }, include: bookingDetailInclude });
  if (!b) notFound();
  const c = CATEGORIES[b.model.category];
  const canConfirm = b.status === "PENDING_PAYMENT" || (b.status === "EXPIRED" && b.endAt > new Date());
  const canCancel = ["PENDING_PAYMENT", "PAID", "EXPIRED"].includes(b.status);

  return (
    <>
      <Link href="/admin/booking" className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
        <ChevronLeft className="h-4 w-4" /> Semua booking
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-mono text-3xl font-extrabold tracking-wider">{b.code}</h1>
          <StatusBadge status={b.status} className="px-3 py-1.5 text-sm" />
        </div>
        <div className="flex flex-wrap gap-2">
          {(b.status === "PAID" || b.status === "IN_USE") && (
            <Link href={`/admin/scan?q=${b.code}`} className={buttonClass("brand", "md")}>
              <ScanLine className="h-4 w-4" /> {b.status === "PAID" ? "Check-in" : "Check-out"}
            </Link>
          )}
          <a href={`/booking/${b.publicToken}`} target="_blank" rel="noreferrer" className={buttonClass("outline", "md")}>
            <ExternalLink className="h-4 w-4" /> Halaman pelanggan
          </a>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="grid content-start gap-6">
          {canConfirm && (
            <section className="rounded-3xl bg-white p-5 ring-2 ring-emerald-300 shadow-pop">
              <p className="font-display text-lg font-extrabold">Konfirmasi pembayaran manual</p>
              <p className="mb-4 text-sm text-muted">
                Pastikan uang sudah diterima (tunai / mutasi rekening / QRIS toko). Status → LUNAS & invoice terbit.
              </p>
              <ConfirmPaymentPanel bookingId={b.id} amount={b.totalAmount} expired={b.status === "EXPIRED"} />
            </section>
          )}

          <section className="rounded-3xl bg-white p-5 ring-1 ring-line shadow-pop">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={`text-xs font-bold uppercase tracking-wider ${c.accent}`}>{c.label}</p>
                <p className="font-display text-2xl font-extrabold">
                  {b.model.name} × {b.quantity}
                </p>
              </div>
              <p className="font-display text-2xl font-extrabold">{rupiah(b.totalAmount)}</p>
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <Info label="Ambil" value={fmtDateTime(b.startAt)} />
              <Info label="Kembali" value={fmtDateTime(b.endAt)} />
              <Info label="Durasi" value={fmtDuration((b.endAt.getTime() - b.startAt.getTime()) / 60000)} />
              <Info label="Hold sampai" value={b.holdExpiresAt ? fmtDateTime(b.holdExpiresAt) : "—"} />
              <Info label="Dibuat" value={fmtDateTime(b.createdAt)} />
              <Info label="Invoice" value={b.invoice?.invoiceNumber ?? "—"} />
            </dl>
            {b.notes && <p className="mt-4 rounded-2xl bg-cream p-3 text-sm">📝 {b.notes}</p>}
            {b.units.some((u) => u.unit) && (
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">Unit diserahkan</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {b.units.map((u) =>
                    u.unit ? (
                      <span key={u.id} className="rounded-xl bg-ink px-3 py-1.5 font-mono text-sm font-bold text-white">
                        {u.unit.serialNumber}
                      </span>
                    ) : null,
                  )}
                </div>
              </div>
            )}
            {b.invoice && (
              <a href={`/api/invoices/${b.publicToken}/pdf`} className={buttonClass("ink", "sm", "mt-5")}>
                <FileDown className="h-4 w-4" /> PDF invoice
              </a>
            )}
          </section>

          {b.rental && (
            <section className="rounded-3xl bg-white p-5 ring-1 ring-line">
              <p className="font-display text-lg font-extrabold">Serah terima</p>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <Info label="Check-in" value={`${fmtDateTime(b.rental.checkedInAt)} · ${b.rental.checkedInBy.name}`} />
                <Info label="Jaminan" value={`${collateralLabel(b.rental.collateralType)}${b.rental.collateralNote ? ` — ${b.rental.collateralNote}` : ""}`} />
                <Info
                  label="Check-out"
                  value={b.rental.checkedOutAt ? `${fmtDateTime(b.rental.checkedOutAt)} · ${b.rental.checkedOutBy?.name ?? "-"}` : "Belum"}
                />
                <Info label="Jaminan dikembalikan" value={b.rental.collateralReturned ? "Ya" : "Belum"} />
                {b.rental.checkedOutAt && (
                  <>
                    <Info label="Terlambat" value={`${b.rental.lateMinutes} menit · ${rupiah(b.rental.lateFee)}`} />
                    <Info label="Kerusakan" value={`${rupiah(b.rental.damageFee)}${b.rental.damageNote ? ` — ${b.rental.damageNote}` : ""}`} />
                    <Info label="Pelunasan" value={paymentMethodLabel(b.rental.settlementMethod)} />
                  </>
                )}
              </dl>
            </section>
          )}

          {b.payments.length > 0 && (
            <section className="rounded-3xl bg-white p-5 ring-1 ring-line">
              <p className="font-display text-lg font-extrabold">Pembayaran</p>
              <div className="mt-3 grid gap-2">
                {b.payments.map((p) => (
                  <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-cream p-3 text-sm">
                    <div>
                      <p className="font-bold">
                        {paymentMethodLabel(p.method)} · {rupiah(p.amount)}
                      </p>
                      <p className="text-xs text-muted">
                        {p.gateway} · {p.paidAt ? fmtDateTime(p.paidAt) : "-"} · dikonfirmasi {p.confirmedBy?.name ?? "sistem"}
                        {p.note ? ` · ${p.note}` : ""}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">{p.status}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="grid content-start gap-6">
          <section className="rounded-3xl bg-ink p-5 text-white shadow-pop">
            <p className="text-xs font-bold uppercase tracking-wider text-lime">Pelanggan</p>
            <p className="mt-1 font-display text-2xl font-extrabold">{b.customerName}</p>
            <p className="mt-3 flex items-center gap-2 text-sm text-white/80">
              <Phone className="h-4 w-4" /> {b.customerPhone}
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm text-white/80">
              <Mail className="h-4 w-4" /> {b.customerEmail}
            </p>
            <a
              href={waLink(b.customerPhone, `Halo ${b.customerName}, ini Pleazure Cycling Culture soal booking ${b.code}.`)}
              target="_blank"
              rel="noreferrer"
              className={buttonClass("success", "sm", "mt-4")}
            >
              <WhatsappIcon className="h-4 w-4" /> Chat WhatsApp
            </a>
          </section>
          <section className="rounded-3xl bg-white p-5 ring-1 ring-line">
            <p className="font-display text-lg font-extrabold">Riwayat status</p>
            <div className="mt-4">
              <StatusTimeline steps={bookingTimeline(b)} />
            </div>
          </section>
          {canCancel && <CancelBookingButton bookingId={b.id} />}
        </aside>
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
