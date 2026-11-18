"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, type Transition } from "motion/react";
import { ArrowRight, Search } from "lucide-react";
import { Logo, LogoMark } from "./logo";
import { useScrolledPast, useScrollSpy, type SpySection } from "./use-scroll";
import { cn } from "@/lib/utils";

const LINKS: { href: string; label: string; section?: SpySection }[] = [
  { href: "/sepeda", label: "Katalog" },
  { href: "/#cara-sewa", label: "Cara Sewa", section: "cara-sewa" },
  { href: "/#kalkulator", label: "Cek Biaya", section: "kalkulator" },
  { href: "/syarat", label: "Syarat" },
  { href: "/#lokasi", label: "Lokasi", section: "lokasi" },
];

const morph: Transition = { type: "spring", stiffness: 420, damping: 34, mass: 0.8 };
/** Sliding active-tab pill. */
const slide: Transition = { type: "spring", stiffness: 380, damping: 30 };

/**
 * Site navigation.
 * - Mobile (< md): static logo bar at the top (not sticky); navigation lives in <MobileBottomNav>.
 * - Desktop (≥ md): floating glass pill. Past 100px of scroll it morphs into a small capsule
 *   (logo + menu indicator) and expands again on hover / keyboard focus / tap.
 */
export function Navbar() {
  return (
    <>
      {/* In-flow bar: keeps the 72px offset the pages rely on (hero uses -mt-18). */}
      <header className="relative z-40 h-18">
        <div className="mx-auto flex h-full max-w-7xl items-center px-4 md:hidden">
          <Link href="/" aria-label="Beranda pleazure.cc">
            <Logo />
          </Link>
        </div>
      </header>
      <DesktopPill />
    </>
  );
}

/** Animates an inline group open (width auto) or shut (width 0) while it fades/blurs. */
function Collapsible({ show, className, children }: { show: boolean; className?: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={false}
      animate={{ width: show ? "auto" : 0, opacity: show ? 1 : 0, filter: show ? "blur(0px)" : "blur(4px)" }}
      transition={{
        width: morph,
        opacity: { duration: show ? 0.22 : 0.12, delay: show ? 0.08 : 0 },
        filter: { duration: show ? 0.22 : 0.12, delay: show ? 0.08 : 0 },
      }}
      aria-hidden={!show}
      inert={!show}
      className={cn("shrink-0 overflow-x-clip", className)}
    >
      <div className="flex w-max items-center">{children}</div>
    </motion.div>
  );
}

function DesktopPill() {
  const pathname = usePathname();
  const scrolled = useScrolledPast(100);
  const spy = useScrollSpy(pathname === "/");
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const expanded = !scrolled || hovered || focused;

  // On click, jump the pill straight to the clicked tab instead of letting the scroll-spy
  // walk it through every section the page scrolls past.
  const [pending, setPending] = useState<SpySection | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const onTabClick = (l: (typeof LINKS)[number]) => {
    clearTimeout(timer.current);
    if (!l.section || pathname !== "/") return setPending(null);
    setPending(l.section);
    timer.current = setTimeout(() => setPending(null), 1400);
  };
  const section = pathname === "/" ? (pending ?? spy) : null;

  const isActive = (l: (typeof LINKS)[number]) =>
    l.section ? section === l.section : pathname === l.href || pathname.startsWith(`${l.href}/`);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-5 z-50 hidden justify-center px-4 md:flex">
      <nav
        aria-label="Navigasi utama"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setFocused(false)}
        className="pointer-events-auto flex items-center rounded-full border border-white/60 bg-white/50 p-1.5 ring-1 ring-black/[.04] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl backdrop-saturate-150"
      >
        <Link href="/" aria-label="Beranda pleazure.cc" className="flex shrink-0 items-center rounded-full">
          <LogoMark className="h-9 w-9" />
          <Collapsible show={expanded} className="hidden lg:block">
            <span className="pl-2.5 pr-1 font-display text-[17px] font-extrabold tracking-tight text-ink">
              pleazure<span className="text-pink">.cc</span>
            </span>
          </Collapsible>
        </Link>

        <Collapsible show={expanded}>
          <ul className="mx-2 flex items-center lg:mx-4">
            {LINKS.map((l) => {
              const active = isActive(l);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => onTabClick(l)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative isolate block whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition-colors duration-200 lg:px-3.5",
                      active ? "text-slate-900" : "text-slate-600 hover:text-slate-900",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="activeNavPill"
                        transition={slide}
                        className="absolute inset-0 -z-10 overflow-hidden rounded-full bg-white/80 ring-1 ring-white shadow-[inset_0_1px_0_rgba(255,255,255,1),0_1px_2px_rgba(22,15,46,0.06),0_6px_16px_-6px_rgba(22,15,46,0.18)]"
                      >
                        {/* glossy highlight on the upper half */}
                        <span className="absolute inset-x-1.5 top-0 h-1/2 rounded-t-full bg-gradient-to-b from-white to-white/0" />
                      </motion.span>
                    )}
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href="/cek-booking"
            aria-label="Cek booking"
            title="Cek booking"
            className="mr-1.5 grid h-10 w-10 place-items-center rounded-full text-slate-600 transition hover:bg-white/70 hover:text-slate-900 hover:shadow-[inset_0_1px_0_rgba(255,255,255,1)]"
          >
            <Search className="h-[18px] w-[18px]" />
          </Link>
          <Link
            href="/sepeda"
            className="group inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full bg-brand px-4 text-sm font-bold text-white shadow-[0_8px_20px_-8px_rgba(255,46,126,.7)] transition hover:brightness-110"
          >
            Sewa Sekarang <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
        </Collapsible>

        <Collapsible show={!expanded}>
          <button
            type="button"
            aria-label="Buka menu navigasi"
            onClick={() => setHovered(true)}
            className="ml-1.5 mr-0.5 flex h-9 items-center gap-1 rounded-full bg-white/70 px-3 shadow-[inset_0_1px_0_rgba(255,255,255,1)] ring-1 ring-white/80"
          >
            {["bg-orange", "bg-pink", "bg-violet"].map((c) => (
              <span key={c} className={cn("h-1.5 w-1.5 rounded-full", c)} />
            ))}
          </button>
        </Collapsible>
      </nav>
    </div>
  );
}
