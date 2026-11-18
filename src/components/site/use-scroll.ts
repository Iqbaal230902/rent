"use client";

import { useEffect, useState } from "react";

/** Home-page sections tracked by the scroll-spy, in document order. */
export const SPY_SECTIONS = ["kategori", "cara-sewa", "kalkulator", "aturan", "lokasi"] as const;
export type SpySection = (typeof SPY_SECTIONS)[number];

/** Runs `fn` on scroll/resize, at most once per animation frame (works with Lenis too). */
function useScrollFrame(fn: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(() => ((raf = 0), fn()));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [fn, enabled]);
}

/** true when the page has been scrolled further than `threshold` px. */
export function useScrolledPast(threshold: number) {
  const [past, setPast] = useState(false);
  const [check] = useState(() => () => setPast(window.scrollY > threshold));
  useScrollFrame(check);
  return past;
}

/**
 * Scroll-spy: the last section whose top has crossed 35% of the viewport height.
 * Returns null above the first section (the hero) or when disabled (not on the home page).
 */
export function useScrollSpy(enabled: boolean): SpySection | null {
  const [active, setActive] = useState<SpySection | null>(null);
  const [check] = useState(() => () => {
    const line = window.innerHeight * 0.35;
    let current: SpySection | null = null;
    for (const id of SPY_SECTIONS) {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= line) current = id;
    }
    // At the very bottom the last section may never reach the line.
    const doc = document.documentElement;
    if (current && window.innerHeight + window.scrollY >= doc.scrollHeight - 2) current = SPY_SECTIONS.at(-1)!;
    setActive(current);
  });
  useScrollFrame(check, enabled);
  return enabled ? active : null;
}
