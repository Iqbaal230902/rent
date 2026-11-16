import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { prisma } from "@/lib/db";
import { expireHolds } from "@/lib/booking";
import { BOOKING_STATUS, CATEGORIES, type BookingStatusKey } from "@/lib/constants";
import { fmtDateTime, rupiah } from "@/lib/format";
import { addMinutes, fromWib } from "@/lib/time";
import { StatusBadge } from "@/components/ui/badge";
import { PageTitle } from "@/components/admin/page-title";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Booking" };
const PAGE = 25;
const STATUSES = Object.keys(BOOKING_STATUS) as BookingStatusKey[];

export default async function BookingListPage({ searchParams }: PageProps<"/admin/booking">) {
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const status = STATUSES.includes(str("status") as BookingStatusKey) ? (str("status") as BookingStatusKey) : null;
  const q = str("q").trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(str("date")) ? str("date") : "";
  const page = Math.max(1, Number(str("page")) || 1);

  await expireHolds();
  const where: Prisma.BookingWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { code: { contains: q.toUpperCase() } },
            { customerName: { contains: q } },
            { customerPhone: { contains: q.replace(/\D/g, "") || q } },
          ],
        }
      : {}),
    ...(date ? { startAt: { gte: fromWib(date, "00:00"), lt: addMinutes(fromWib(date, "00:00"), 1440) } } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { startAt: "desc" },
      skip: (page - 1) * PAGE,
      take: PAGE,
      include: { model: { select: { name: true, category: true } } },
    }),
    prisma.booking.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const qs = (patch: Record<string, string | number | null>) => {
    const p = new URLSearchParams();
    const base = { status: status ?? "", q, date, page: String(page), ...patch };
    for (const [k, v] of Object.entries(base)) if (v !== null && v !== "" && !(k === "page" && v === "1")) p.set(k, String(v));
    const s = p.toString();
    return s ? `?${s}` : "";
  };

  return (
    <>
      <PageTitle title="Booking" subtitle={`${total} booking ditemukan`} />
      <form className="grid gap-3 rounded-3xl bg-white p-4 ring-1 ring-line sm:grid-cols-[1fr_auto_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Cari kode, nama, atau no. WA"
            className="h-11 w-full rounded-2xl bg-cream/60 pl-10 pr-4 text-sm ring-1 ring-inset ring-line focus:outline-none focus:ring-2 focus:ring-violet/60"
          />
        </div>
        <input
          type="date"
          name="date"
          defaultValue={date}
          aria-label="Tanggal ambil"
          className="h-11 rounded-2xl bg-cream/60 px-3 text-sm ring-1 ring-inset ring-line"
        />
        <select name="status" defaultValue={status ?? ""} className="h-11 rounded-2xl bg-cream/60 px-3 text-sm font-semibold ring-1 ring-inset ring-line">
          <option value="">Semua status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {BOOKING_STATUS[s].label}
            </option>
          ))}
        </select>
        <button className={buttonClass("ink", "md", "h-11")}>Terapkan</button>
      </form>

      <div className="mt-4 overflow-hidden rounded-3xl bg-white ring-1 ring-line shadow-pop">
        <div className="hidden grid-cols-[1.1fr_1.4fr_1.5fr_1fr_auto] gap-4 border-b border-line bg-cream/60 px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted md:grid">
          <span>Kode</span>
          <span>Pelanggan</span>
          <span>Sewa</span>
          <span className="text-right">Total</span>
          <span className="w-28 text-right">Status</span>
        </div>
        {rows.map((b) => (
          <Link
            key={b.id}
            href={`/admin/booking/${b.id}`}
            className="grid gap-1 border-b border-line px-5 py-4 transition last:border-0 hover:bg-cream/50 md:grid-cols-[1.1fr_1.4fr_1.5fr_1fr_auto] md:items-center md:gap-4"
          >
            <div className="flex items-center justify-between md:block">
              <span className="font-mono text-sm font-bold">{b.code}</span>
              <span className="md:hidden">
                <StatusBadge status={b.status} />
              </span>
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold">{b.customerName}</p>
              <p className="text-xs text-muted">{b.customerPhone}</p>
            </div>
            <div className="min-w-0 text-sm">
              <p className="truncate font-semibold">
                <span className={CATEGORIES[b.model.category].accent}>●</span> {b.model.name} ×{b.quantity}
              </p>
              <p className="text-xs text-muted">{fmtDateTime(b.startAt)}</p>
            </div>
            <p className="font-display font-extrabold md:text-right">{rupiah(b.totalAmount)}</p>
            <span className="hidden w-28 text-right md:block">
              <StatusBadge status={b.status} />
            </span>
          </Link>
        ))}
        {rows.length === 0 && <p className="py-16 text-center text-muted">Tidak ada booking yang cocok.</p>}
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Link
            href={qs({ page: Math.max(1, page - 1) })}
            className={cn(buttonClass("outline", "sm"), page <= 1 && "pointer-events-none opacity-40")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="text-sm font-semibold">
            {page} / {pages}
          </span>
          <Link
            href={qs({ page: Math.min(pages, page + 1) })}
            className={cn(buttonClass("outline", "sm"), page >= pages && "pointer-events-none opacity-40")}
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </>
  );
}
