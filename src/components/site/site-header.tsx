"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { Logo } from "./logo";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/sepeda", label: "Katalog" },
  { href: "/#cara-sewa", label: "Cara Sewa" },
  { href: "/#kalkulator", label: "Kalkulator" },
  { href: "/syarat", label: "Syarat & Ketentuan" },
  { href: "/#lokasi", label: "Lokasi" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all",
        scrolled ? "bg-cream/85 backdrop-blur-xl shadow-[0_1px_0_rgba(22,15,46,.06)]" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="Beranda pleazure.cc" onClick={() => setOpen(false)}>
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm font-semibold text-ink/70 transition hover:bg-ink/5 hover:text-ink",
                pathname === n.href && "bg-ink/5 text-ink",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/cek-booking" className={buttonClass("ghost", "sm", "hidden sm:inline-flex")}>
            <Search className="h-4 w-4" /> Cek Booking
          </Link>
          <Link href="/sepeda" className={buttonClass("brand", "sm", "hidden sm:inline-flex px-4")}>
            Sewa Sekarang
          </Link>
          <button
            className="grid h-10 w-10 place-items-center rounded-xl text-ink hover:bg-ink/5 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Tutup menu" : "Buka menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-line bg-cream/95 backdrop-blur-xl lg:hidden">
          <nav className="mx-auto grid max-w-7xl gap-1 px-4 py-3">
            {[...NAV, { href: "/cek-booking", label: "Cek Booking" }].map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-3 text-[15px] font-semibold text-ink hover:bg-ink/5"
              >
                {n.label}
              </Link>
            ))}
            <Link href="/sepeda" onClick={() => setOpen(false)} className={buttonClass("brand", "md", "mt-2")}>
              Sewa Sekarang
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
