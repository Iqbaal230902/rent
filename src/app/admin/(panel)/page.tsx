import Link from "next/link";
import { AlarmClock, ArrowRight, Bike, CircleDollarSign, PackageCheck, ScanLine, Wrench } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { expireHolds } from "@/lib/booking";
import { requireStaffPage } from "@/lib/auth";
import { BOOKING_STATUS, type BookingStatusKey } from "@/lib/constants";
import { fmtDate, fmtTime, rupiah } from "@/lib/format";
import { addMinutes, startOfDayWib } from "@/lib/time";
import { StatusBadge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { PageTitle } from "@/components/admin/page-title";
import { cn } from "@/lib/utils";

const FILTERS: (BookingStatusKey | "ALL")[] = ["ALL", "PENDING_PAYMENT", "PAID", "IN_USE", "COMPLETED"];

export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  const user = await requireStaffPage();
  const sp = await searchParams;
  const filter = (typeof sp.status === "string" && (FILTERS as string[]).includes(sp.status) ? sp.status : "ALL") as
    | BookingStatusKey
    | "ALL";

  await expireHolds();
  const now = new Date();
  const dayStart = startOfDayWib(now);
  const dayEnd = addMinutes(dayStart, 24 * 60);
  const statusWhere: Prisma.BookingWhereInput =
    filter === "ALL" ? { status: { in: ["PENDING_PAYMENT", "PAID", "IN_USE", "COMPLETED"] } } : { status: filter };

  const select = {
    id: true,
    code: true,
    status: true,
    customerName: true,
    customerPhone: true,
    quantity: true,
    startAt: true,
    endAt: true,
    totalAmount: true,
    model: { select: { name: true, category: true } },
  } satisfies Prisma.BookingSelect;

  const [pickups, returns, pendingCount, inUseCount, overdue, unitStats] = await Promise.all([
    prisma.booking.findMany({
      where: { startAt: { gte: dayStart, lt: dayEnd }, ...statusWhere },
      orderBy: { startAt: "asc" },
      select,
    }),
    prisma.booking.findMany({
      where: {
        endAt: { gte: dayStart, lt: dayEnd },
        status: filter === "ALL" ? { in: ["IN_USE", "COMPLETED"] } : filter,
      },
      orderBy: { endAt: "asc" },
      select,
    }),
    prisma.booking.count({ where: { status: "PENDING_PAYMENT" } }),
    prisma.booking.count({ where: { status: "IN_USE" } }),
    prisma.booking.findMany({ where: { status: "IN_USE", endAt: { lt: now } }, orderBy: { endAt: "asc" }, select }),
    prisma.bikeUnit.groupBy({ by: ["status"], _count: true }),
  ]);
  const units = Object.fromEntries(unitStats.map((u) => [u.status, u._count])) as Record<string, number>;
  const pickupsWaiting = pickups.filter((p) => p.status === "PAID").length;

  const tiles = [
    { label: "Menunggu bayar", value: pendingCount, icon: CircleDollarSign, grad: "from-amber-400 to-orange", href: "/admin/booking?status=PENDING_PAYMENT" },
    { label: "Siap diambil hari ini", value: pickupsWaiting, icon: PackageCheck, grad: "from-emerald-400 to-teal-500", href: "/admin?status=PAID" },
    { label: "Sedang disewa", value: inUseCount, icon: Bike, grad: "from-sky to-violet", href: "/admin/booking?status=IN_USE" },
    { label: "Terlambat kembali", value: overdue.length, icon: AlarmClock, grad: "from-pink to-rose-600", href: "#terlambat" },
  ];

  return (
    <>
      <PageTitle
        title={<>Halo, {user.name.split(" ")[0]} 👋</>}
        subtitle={`${fmtDate(now)} · ${units.AVAILABLE ?? 0} unit siap, ${units.MAINTENANCE ?? 0} maintenance`}
        action={
          <Link href="/admin/scan" className={buttonClass("brand", "md")}>
            <ScanLine className="h-4 w-4" /> Scan QR
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className={cn("relative overflow-hidden rounded-3xl bg-gradient-to-br p-4 text-white shadow-pop transition hover:-translate-y-0.5", t.grad)}
          >
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/20" />
            <t.icon className="h-6 w-6" />
            <p className="mt-4 font-display text-4xl font-extrabold">{t.value}</p>
            <p className="text-sm font-semibold text-white/90">{t.label}</p>
          </Link>
        ))}
      </div>

      {overdue.length > 0 && (
        <section id="terlambat" className="mt-6 rounded-3xl bg-rose-50 p-4 ring-1 ring-rose-200 sm:p-5">
          <p className="flex items-center gap-2 font-display text-lg font-extrabold text-rose-700">
            <AlarmClock className="h-5 w-5" /> Belum kembali (lewat jadwal)
          </p>
          <div className="mt-3 grid gap-2">
            {overdue.map((b) => (
              <BookingRow key={b.id} b={b} time={b.endAt} timeLabel="harus kembali" overdue />
            ))}
          </div>
        </section>
      )}

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "ALL" ? "/admin" : `/admin?status=${f}`}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-bold transition",
              filter === f ? "bg-ink text-white" : "bg-white text-ink ring-1 ring-inset ring-line hover:ring-ink/30",
            )}
          >
            {f === "ALL" ? "Semua" : BOOKING_STATUS[f].label}
          </Link>
        ))}
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <ScheduleCard title="Jadwal ambil hari ini" accent="bg-orange" empty="Tidak ada pengambilan untuk filter ini.">
          {pickups.map((b) => (
            <BookingRow key={b.id} b={b} time={b.startAt} timeLabel="ambil" />
          ))}
        </ScheduleCard>
        <ScheduleCard title="Jadwal kembali hari ini" accent="bg-violet" empty="Tidak ada pengembalian untuk filter ini.">
          {returns.map((b) => (
            <BookingRow key={b.id} b={b} time={b.endAt} timeLabel="kembali" />
          ))}
        </ScheduleCard>
      </div>

      {(units.MAINTENANCE ?? 0) > 0 && user.role === "ADMIN" && (
        <Link
          href="/admin/armada"
          className="mt-6 flex items-center gap-3 rounded-3xl bg-amber-50 p-4 text-sm font-semibold text-amber-900 ring-1 ring-amber-200"
        >
          <Wrench className="h-5 w-5" /> {units.MAINTENANCE} unit sedang maintenance — cek di Armada
          <ArrowRight className="ml-auto h-4 w-4" />
        </Link>
      )}
    </>
  );
}

function ScheduleCard({ title, accent, empty, children }: { title: string; accent: string; empty: string; children: React.ReactNode[] }) {
  return (
    <section className="rounded-3xl bg-white p-4 ring-1 ring-line shadow-pop sm:p-5">
      <p className="flex items-center gap-2 font-display text-lg font-extrabold">
        <span className={cn("h-3 w-3 rounded-full", accent)} /> {title}
        <span className="ml-auto rounded-full bg-cream px-2.5 py-0.5 text-sm">{children.length}</span>
      </p>
      <div className="mt-3 grid gap-2">{children.length ? children : <p className="py-8 text-center text-sm text-muted">{empty}</p>}</div>
    </section>
  );
}

function BookingRow({
  b,
  time,
  timeLabel,
  overdue,
}: {
  b: {
    id: number;
    code: string;
    status: string;
    customerName: string;
    quantity: number;
    totalAmount: number;
    model: { name: string };
  };
  time: Date;
  timeLabel: string;
  overdue?: boolean;
}) {
  return (
    <Link
      href={`/admin/booking/${b.id}`}
      className="flex items-center gap-3 rounded-2xl bg-cream/70 p-3 transition hover:bg-cream hover:ring-1 hover:ring-line"
    >
      <div className={cn("w-16 shrink-0 rounded-xl py-1.5 text-center", overdue ? "bg-rose-500 text-white" : "bg-white")}>
        <p className="font-display text-lg font-extrabold leading-none">{fmtTime(time)}</p>
        <p className={cn("text-[10px] font-semibold", overdue ? "text-white/80" : "text-muted")}>{timeLabel}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{b.customerName}</p>
        <p className="truncate text-xs text-muted">
          <span className="font-mono">{b.code}</span> · {b.model.name} ×{b.quantity} · {rupiah(b.totalAmount)}
        </p>
      </div>
      <StatusBadge status={b.status} />
    </Link>
  );
}
