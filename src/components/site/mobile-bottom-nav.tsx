"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Bike, CalendarPlus, House, MapPin, ShieldCheck, type LucideIcon } from "lucide-react";
import { useScrollSpy, type SpySection } from "./use-scroll";
import { cn } from "@/lib/utils";

type TabKey = "beranda" | "sepeda" | "sewa" | "aturan" | "garasi";

const TABS: { key: TabKey; href: string; label: string; icon: LucideIcon; primary?: boolean }[] = [
  { key: "beranda", href: "/#beranda", label: "Beranda", icon: House },
  { key: "sepeda", href: "/#kategori", label: "Sepeda", icon: Bike },
  { key: "sewa", href: "/#kalkulator", label: "Sewa", icon: CalendarPlus, primary: true },
  { key: "aturan", href: "/#aturan", label: "Aturan", icon: ShieldCheck },
  { key: "garasi", href: "/#lokasi", label: "Garasi", icon: MapPin },
];

const SECTION_TO_TAB: Record<SpySection, TabKey> = {
  kategori: "sepeda",
  "cara-sewa": "sepeda",
  kalkulator: "sewa",
  aturan: "aturan",
  lokasi: "garasi",
};

/** Native-app style floating tab bar, mobile only (< md). Active tab follows the scroll position on the home page. */
export function MobileBottomNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const spy = useScrollSpy(isHome);

  const active: TabKey | null = isHome
    ? spy
      ? SECTION_TO_TAB[spy]
      : "beranda"
    : pathname.startsWith("/sepeda")
      ? "sepeda"
      : pathname.startsWith("/syarat")
        ? "aturan"
        : null;

  return (
    <nav
      aria-label="Navigasi bawah"
      className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 md:hidden"
    >
      <ul className="grid grid-cols-5 items-end rounded-2xl border border-slate-200/60 bg-white/80 px-1 py-1.5 shadow-[0_12px_36px_-12px_rgba(22,15,46,.35)] backdrop-blur-md">
        {TABS.map((t) => {
          const isActive = active === t.key;
          return (
            <li key={t.key} className="flex justify-center">
              <Link
                href={t.href}
                aria-current={isActive ? "page" : undefined}
                className="group flex w-full flex-col items-center gap-0.5 rounded-xl py-1 outline-offset-0"
              >
                {t.primary ? (
                  <span
                    className={cn(
                      "-mt-7 grid h-14 w-14 place-items-center rounded-2xl bg-brand text-white shadow-[0_10px_24px_-8px_rgba(255,46,126,.75)] ring-4 ring-cream transition-transform group-active:scale-95",
                      isActive && "scale-105 ring-white",
                    )}
                  >
                    <t.icon className="h-6 w-6" strokeWidth={2.4} />
                  </span>
                ) : (
                  <span className="relative isolate grid h-8 w-12 place-items-center">
                    {isActive && (
                      <motion.span
                        layoutId="tab-active"
                        transition={{ type: "spring", stiffness: 500, damping: 36 }}
                        className="absolute inset-0 -z-10 rounded-full bg-pink/10"
                      />
                    )}
                    <t.icon
                      className={cn("h-5 w-5 transition-colors", isActive ? "text-pink" : "text-ink/55")}
                      strokeWidth={isActive ? 2.4 : 2}
                    />
                  </span>
                )}
                <span
                  className={cn(
                    "text-[11px] font-semibold leading-tight transition-colors",
                    isActive ? (t.primary ? "text-brand" : "text-pink") : "text-ink/55",
                  )}
                >
                  {t.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
