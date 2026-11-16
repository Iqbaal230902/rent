import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bike,
  CalendarCheck2,
  Clock,
  CreditCard,
  MapPin,
  QrCode,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Undo2,
  Wrench,
} from "lucide-react";
import { getPublicModels } from "@/lib/catalog";
import { getPublicContext } from "@/lib/public-context";
import { BUSINESS, CATEGORIES, CATEGORY_ORDER, waLink } from "@/lib/constants";
import { rupiah } from "@/lib/format";
import { buttonClass } from "@/components/ui/button";
import { BikeArt } from "@/components/site/bike-art";
import { PriceCalculator } from "@/components/site/price-calculator";
import { WhatsappIcon } from "@/components/site/social-icons";
import { TermsList } from "@/components/site/terms";

export default async function HomePage() {
  const [{ settings, rules, todayDate, initialWindow }, models] = await Promise.all([
    getPublicContext(),
    getPublicModels(),
  ]);
  const hours = `${settings.openTime.replace(":", ".")}–${settings.closeTime.replace(":", ".")}`;
  const totalUnits = models.reduce((a, m) => a + m.totalUnits, 0);
  const hero = models.find((m) => m.category === "ROAD") ?? models[0];
  const fromPrice = (cat: string) => {
    const list = models.filter((m) => m.category === cat);
    return list.length ? Math.min(...list.map((m) => m.pricePerHour)) : null;
  };

  return (
    <>
      {/* ============ HERO (A-01) ============ */}
      <section className="relative -mt-18 overflow-hidden pt-18">
        <div className="pointer-events-none absolute inset-0 bg-dots opacity-60 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="pointer-events-none absolute -left-32 top-10 h-[420px] w-[420px] rounded-full bg-orange/30 blur-[90px]" />
        <div className="pointer-events-none absolute right-[-120px] top-[-60px] h-[480px] w-[480px] rounded-full bg-violet/30 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-[-160px] left-1/3 h-[360px] w-[360px] rounded-full bg-pink/25 blur-[90px]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-10 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pb-28 lg:pt-16">
          <div>
            <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold text-ink ring-1 ring-line backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Buka setiap hari {hours} WIB · {BUSINESS.address}
            </span>
            <h1 className="mt-6 text-[44px] font-extrabold leading-[1.02] sm:text-6xl lg:text-7xl">
              Gowes keliling Sukabumi, <span className="text-brand">tinggal scan & jalan.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/70">
              Sewa road bike, MTB, e-bike & sepeda lipat dari {BUSINESS.name}. Cek stok real-time, booking dalam 2 menit,
              dan ambil sepeda cukup dengan QR invoice.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/sepeda" className={buttonClass("brand", "lg")}>
                Sewa Sekarang <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="#kalkulator" className={buttonClass("outline", "lg")}>
                Hitung biaya
              </Link>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-3">
              {[
                { k: "4", v: "kategori sepeda", c: "bg-orange" },
                { k: `${totalUnits}+`, v: "unit siap gowes", c: "bg-pink" },
                { k: "< 2 mnt", v: "serah terima", c: "bg-violet" },
              ].map((s) => (
                <div key={s.v} className="rounded-2xl bg-white/80 p-3 ring-1 ring-line backdrop-blur">
                  <span className={`mb-2 block h-1.5 w-8 rounded-full ${s.c}`} />
                  <dt className="font-display text-2xl font-extrabold">{s.k}</dt>
                  <dd className="text-xs font-medium text-muted">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* visual */}
          <div className="relative mx-auto w-full max-w-[520px]">
            <div className="absolute inset-6 rotate-6 rounded-[40px] bg-lime" />
            <div className="relative rounded-[40px] bg-ink p-6 shadow-[0_40px_80px_-30px_rgba(22,15,46,.6)]">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">
                  {hero ? CATEGORIES[hero.category].label : "Road Bike"}
                </span>
                {hero && (
                  <span className="rounded-full bg-lime px-3 py-1 text-xs font-extrabold text-ink">{hero.totalUnits} unit armada</span>
                )}
              </div>
              <div className="mx-auto my-4 aspect-[3/2] w-full rounded-[28px] bg-gradient-to-br from-white to-cream">
                <BikeArt category={hero?.category ?? "ROAD"} />
              </div>
              {hero && (
                <div className="flex items-end justify-between gap-4 text-white">
                  <div>
                    <p className="font-display text-xl font-extrabold sm:text-2xl">{hero.name}</p>
                    <p className="text-sm text-white/60">{Object.values(hero.specs).slice(1, 3).join(" · ")}</p>
                  </div>
                  <p className="text-right">
                    <span className="block text-xs text-white/60">mulai</span>
                    <span className="whitespace-nowrap font-display text-xl font-extrabold text-lime sm:text-2xl">{rupiah(hero.pricePerHour)}</span>
                    <span className="text-xs text-white/60">/jam</span>
                  </p>
                </div>
              )}
            </div>
            <div
              className="absolute -left-4 top-1/2 hidden animate-float rounded-3xl bg-white p-3 shadow-pop ring-1 ring-line sm:block"
              style={{ ["--r" as string]: "-6deg" }}
            >
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand text-white">
                  <QrCode className="h-6 w-6" />
                </span>
                <div className="pr-2">
                  <p className="text-xs font-bold text-emerald-600">LUNAS ✓</p>
                  <p className="font-display text-sm font-extrabold">Invoice terbit otomatis</p>
                </div>
              </div>
            </div>
            <div
              className="absolute -bottom-6 right-2 hidden animate-float rounded-3xl bg-white px-4 py-3 shadow-pop ring-1 ring-line sm:block"
              style={{ ["--r" as string]: "4deg", animationDelay: "1.5s" }}
            >
              <p className="flex items-center gap-2 text-sm font-bold">
                <ScanLine className="h-4 w-4 text-violet" /> Scan di store → langsung gowes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ MARQUEE ============ */}
      <div className="relative -rotate-1 overflow-hidden bg-ink py-4 text-white">
        <div className="flex w-max animate-marquee gap-8 whitespace-nowrap font-display text-xl font-extrabold">
          {Array.from({ length: 2 }).flatMap((_, k) =>
            ["Road Bike", "MTB", "E-Bike", "Sepeda Lipat", "Bike Build", "Service", "Repaint", "Restorasi", "Bike Wash", "Tour On Bike"].map(
              (t, i) => (
                <span key={`${k}-${t}`} className="flex items-center gap-8">
                  {t}
                  <Sparkles className={["text-orange", "text-pink", "text-lime", "text-sky"][i % 4] + " h-5 w-5"} />
                </span>
              ),
            ),
          )}
        </div>
      </div>

      {/* ============ KATEGORI (A-02) ============ */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <SectionHead eyebrow="Katalog" title="Pilih gaya gowesmu" lead="Empat kategori, semua unit dirawat bengkel sendiri sebelum disewakan." />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORY_ORDER.map((cat) => {
            const c = CATEGORIES[cat];
            const from = fromPrice(cat);
            return (
              <Link
                key={cat}
                href={`/sepeda?kategori=${cat}`}
                className="group relative overflow-hidden rounded-[28px] p-5 text-white shadow-pop transition hover:-translate-y-1.5"
                style={{ background: `linear-gradient(150deg, ${c.from}, ${c.to})` }}
              >
                <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/15" />
                <p className="font-display text-2xl font-extrabold">{c.label}</p>
                <p className="mt-1 text-sm text-white/85">{c.blurb}</p>
                <div className="my-3 aspect-[3/2] rounded-2xl bg-white/90 transition group-hover:rotate-[-2deg]">
                  <BikeArt category={cat} withBackdrop={false} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {from ? (
                      <>
                        mulai <b className="font-display text-lg">{rupiah(from)}</b>/jam
                      </>
                    ) : (
                      "Segera hadir"
                    )}
                  </span>
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink transition group-hover:translate-x-1">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ============ CARA SEWA ============ */}
      <section id="cara-sewa" className="scroll-mt-24 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHead eyebrow="Cara sewa" title="Dari klik sampai gowes, 5 langkah" />
          <ol className="mt-12 grid gap-4 md:grid-cols-5">
            {[
              { icon: CalendarCheck2, t: "Pilih sepeda & jam", d: "Cek sisa unit real-time sesuai rentang waktumu.", c: "#ff6b2c" },
              { icon: BadgeCheck, t: "Booking & unit ditahan", d: `Unit ditahan sampai ${settings.holdMinutesAfterStart} menit setelah jam ambil.`, c: "#ff2e7e" },
              { icon: CreditCard, t: "Bayar", d: "Di store (tunai/QRIS toko) atau transfer, dikonfirmasi staf.", c: "#7c3aed" },
              { icon: QrCode, t: "Invoice ber-QR", d: "Terbit otomatis setelah lunas. Bisa diunduh PDF.", c: "#0891b2" },
              { icon: Bike, t: "Scan & gowes", d: "Tunjukkan QR + E-KTP asli di store. Kembalikan, selesai!", c: "#16a34a" },
            ].map((s, i) => (
              <li key={s.t} className="relative rounded-[28px] bg-cream p-5 ring-1 ring-line">
                <span className="absolute right-5 top-4 font-display text-5xl font-extrabold text-ink/5">{i + 1}</span>
                <span className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: s.c }}>
                  <s.icon className="h-6 w-6" />
                </span>
                <p className="mt-4 font-display text-lg font-extrabold leading-tight">{s.t}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ============ KALKULATOR (A-04) ============ */}
      <section id="kalkulator" className="relative scroll-mt-24 overflow-hidden py-20">
        <div className="pointer-events-none absolute right-0 top-20 h-80 w-80 rounded-full bg-sky/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHead
            eyebrow="Kalkulator"
            title="Berapa biayanya?"
            lead="Tarif per jam, otomatis dibulatkan ke tarif harian kalau lebih hemat. Sama persis dengan harga saat booking."
          />
          <div className="mt-10">
            <PriceCalculator models={models} rules={rules} initialWindow={initialWindow} todayDate={todayDate} />
          </div>
        </div>
      </section>

      {/* ============ KEUNGGULAN ============ */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { icon: Wrench, t: "Dirawat bengkel sendiri", d: "Pleazure juga bengkel: service, rakit & restorasi.", c: "bg-orange" },
            { icon: ShieldCheck, t: "Tanpa double booking", d: "Stok dikunci di sistem saat kamu booking.", c: "bg-pink" },
            { icon: QrCode, t: "Invoice digital", d: "Bukti sewa jelas, cukup tunjukkan QR.", c: "bg-violet" },
            { icon: Undo2, t: "Kembali fleksibel", d: `Toleransi ${settings.graceMinutes} menit sebelum denda berlaku.`, c: "bg-emerald-500" },
          ].map((f) => (
            <div key={f.t} className="rounded-[28px] bg-white p-5 ring-1 ring-line">
              <span className={`grid h-11 w-11 place-items-center rounded-2xl text-white ${f.c}`}>
                <f.icon className="h-5 w-5" />
              </span>
              <p className="mt-4 font-display text-lg font-extrabold">{f.t}</p>
              <p className="mt-1 text-sm text-muted">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ S&K (A-05) ============ */}
      <section className="bg-white py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <SectionHead eyebrow="Syarat & ketentuan" title="Biar sama-sama enak" align="left" />
            <p className="mt-4 text-muted">Ringkasan aturan sewa. Baca versi lengkapnya sebelum booking.</p>
            <Link href="/syarat" className={buttonClass("ink", "md", "mt-6")}>
              Baca selengkapnya <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <TermsList settings={settings} compact />
        </div>
      </section>

      {/* ============ LOKASI (A-06) ============ */}
      <section id="lokasi" className="scroll-mt-24 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid overflow-hidden rounded-[32px] bg-ink text-white shadow-pop lg:grid-cols-[1fr_1.3fr]">
            <div className="relative p-8 sm:p-10">
              <div className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-orange/40 blur-3xl" />
              <p className="relative text-sm font-bold uppercase tracking-wider text-lime">Lokasi store</p>
              <h2 className="relative mt-2 text-4xl font-extrabold">Mampir ke garasi kami</h2>
              <ul className="relative mt-6 space-y-4">
                <li className="flex gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-pink" />
                  <span>{BUSINESS.address}</span>
                </li>
                <li className="flex gap-3">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-sun" />
                  <span>Setiap hari, {hours} WIB</span>
                </li>
              </ul>
              <div className="relative mt-8 flex flex-wrap gap-3">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(BUSINESS.mapsQuery)}`}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonClass("lime", "md")}
                >
                  Buka di Google Maps
                </a>
                <a
                  href={waLink(settings.whatsappNumber, "Halo Pleazure, saya mau tanya soal sewa sepeda.")}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonClass("outline", "md", "bg-white/10 text-white ring-white/20 hover:bg-white/20")}
                >
                  <WhatsappIcon className="h-4 w-4" /> Chat WhatsApp
                </a>
              </div>
            </div>
            <iframe
              title="Peta lokasi Pleazure Cycling Culture"
              src={`https://www.google.com/maps?q=${encodeURIComponent(BUSINESS.mapsQuery)}&output=embed`}
              className="h-80 w-full border-0 lg:h-full lg:min-h-[380px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHead({
  eyebrow,
  title,
  lead,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : ""}>
      <p className="inline-flex rounded-full bg-pink/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-pink">{eyebrow}</p>
      <h2 className="mt-3 text-4xl font-extrabold sm:text-5xl">{title}</h2>
      {lead && <p className="mt-4 text-lg text-muted">{lead}</p>}
    </div>
  );
}
