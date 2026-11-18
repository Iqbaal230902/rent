import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { Logo } from "./logo";
import { InstagramIcon, ThreadsIcon, WhatsappIcon } from "./social-icons";
import { BUSINESS, waLink } from "@/lib/constants";

export function SiteFooter({ openTime, closeTime, whatsapp }: { openTime: string; closeTime: string; whatsapp: string }) {
  return (
    <footer className="relative mt-auto overflow-hidden bg-ink pb-[calc(6rem+env(safe-area-inset-bottom))] text-white md:pb-0">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-pink/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-violet/40 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/65">
            {BUSINESS.name} — sewa sepeda, rakit, service, repaint, restorasi & bike wash di Sukabumi.
          </p>
          <div className="mt-5 flex gap-2">
            {[
              { href: BUSINESS.instagram, label: "Instagram @pleazure.cc", Icon: InstagramIcon },
              { href: BUSINESS.threads, label: "Threads @pleazure.cc", Icon: ThreadsIcon },
              { href: waLink(whatsapp, "Halo Pleazure!"), label: "WhatsApp", Icon: WhatsappIcon },
            ].map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 transition hover:bg-white/20"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
        <div className="space-y-3 text-sm">
          <p className="font-display text-base font-bold">Kunjungi store</p>
          <p className="flex gap-2 text-white/70">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-lime" /> {BUSINESS.address}
          </p>
          <p className="flex gap-2 text-white/70">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-lime" /> Setiap hari {openTime.replace(":", ".")}–
            {closeTime.replace(":", ".")} WIB
          </p>
        </div>
        <div className="grid content-start gap-2 text-sm">
          <p className="font-display text-base font-bold">Menu</p>
          <Link className="text-white/70 hover:text-white" href="/sepeda">Katalog & stok</Link>
          <Link className="text-white/70 hover:text-white" href="/cek-booking">Cek booking</Link>
          <Link className="text-white/70 hover:text-white" href="/syarat">Syarat & ketentuan</Link>
          <Link className="text-white/70 hover:text-white" href="/admin">Login staf</Link>
        </div>
      </div>
      <div className="relative border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-white/50 sm:px-6">
          © {new Date().getFullYear()} {BUSINESS.name}. Harga dalam Rupiah, waktu dalam WIB.
        </p>
      </div>
    </footer>
  );
}
