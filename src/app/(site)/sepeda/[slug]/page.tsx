import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getPublicModels } from "@/lib/catalog";
import { getPublicContext } from "@/lib/public-context";
import { CATEGORIES } from "@/lib/constants";
import { rupiah } from "@/lib/format";
import { BikeVisual } from "@/components/site/bike-art";
import { BookingForm } from "@/components/site/booking-form";
import { windowFromQuery } from "@/lib/window";

export async function generateMetadata({ params }: PageProps<"/sepeda/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const m = (await getPublicModels()).find((x) => x.slug === slug);
  return { title: m ? `Sewa ${m.name}` : "Sepeda tidak ditemukan" };
}

export default async function BikeDetailPage({ params, searchParams }: PageProps<"/sepeda/[slug]">) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const [{ settings, rules, todayDate, initialWindow }, models] = await Promise.all([getPublicContext(), getPublicModels()]);
  const model = models.find((m) => m.slug === slug);
  if (!model) notFound();
  const c = CATEGORIES[model.category];
  const q = Number(typeof sp.q === "string" ? sp.q : 1);

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-40"
        style={{ background: `radial-gradient(60% 60% at 80% 0%, ${c.to}55, transparent), radial-gradient(50% 50% at 0% 20%, ${c.from}40, transparent)` }}
      />
      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-4 sm:px-6">
        <Link href="/sepeda" className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
          <ChevronLeft className="h-4 w-4" /> Katalog
        </Link>

        <div className="mt-4 grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div
            className="relative aspect-[3/2] overflow-hidden rounded-[32px] ring-1 ring-line"
            style={{ background: `linear-gradient(135deg, ${c.from}22, ${c.to}44)` }}
          >
            <BikeVisual category={model.category} photos={model.photos} name={model.name} />
          </div>
          <div>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${c.chip}`}>{c.label}</span>
            <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">{model.name}</h1>
            {model.description && <p className="mt-3 text-lg text-ink/70">{model.description}</p>}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-3xl bg-white p-4 ring-1 ring-line">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">Per jam</p>
                <p className="font-display text-3xl font-extrabold">{rupiah(model.pricePerHour)}</p>
              </div>
              <div className="rounded-3xl p-4 text-white" style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}>
                <p className="text-xs font-bold uppercase tracking-wider text-white/80">Per hari</p>
                <p className="font-display text-3xl font-extrabold">{rupiah(model.pricePerDay)}</p>
              </div>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 rounded-3xl bg-white/70 p-5 ring-1 ring-line sm:grid-cols-3">
              {model.frameSize && (
                <div>
                  <dt className="text-xs font-semibold text-muted">Ukuran</dt>
                  <dd className="font-bold">{model.frameSize}</dd>
                </div>
              )}
              {Object.entries(model.specs).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-semibold text-muted">{k}</dt>
                  <dd className="font-bold">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="mt-12">
          <BookingForm
            model={model}
            rules={rules}
            initialWindow={windowFromQuery(sp, initialWindow)}
            initialQty={Number.isFinite(q) && q >= 1 && q <= 10 ? Math.floor(q) : 1}
            todayDate={todayDate}
            holdMinutes={settings.holdMinutesAfterStart}
          />
        </div>
      </div>
    </div>
  );
}
