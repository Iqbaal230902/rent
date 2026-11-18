"use client";

import { useEffect, useRef } from "react";
import { ReactLenis, type LenisRef } from "lenis/react";
import { MotionConfig, cancelFrame, frame } from "motion/react";
import "lenis/dist/lenis.css";

/**
 * Momentum smooth scroll (Lenis) + global Motion config.
 *
 * - Lenis scrolls the real window (it does not transform content), so the
 *   IntersectionObserver behind Motion's `whileInView` keeps working as normal.
 * - Lenis is driven by Motion's frame loop (`autoRaf: false`), so both libraries
 *   share a single requestAnimationFrame per frame.
 * - In-page anchor links (`#kalkulator`, `/#cara-sewa` on the home page) are
 *   animated by Lenis and honor each section's `scroll-margin-top` (scroll-mt-24).
 * - With prefers-reduced-motion, Lenis falls back to native scroll and Motion skips
 *   transform animations (reducedMotion="user").
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);

  // Drive Lenis from Motion's frame loop.
  useEffect(() => {
    const update = ({ timestamp }: { timestamp: number }) => lenisRef.current?.lenis?.raf(timestamp);
    frame.update(update, true);
    return () => cancelFrame(update);
  }, []);

  // Smooth in-page anchors. Runs in the capture phase, before Next <Link>:
  // preventDefault() makes Link skip its own navigation, but React onClick
  // handlers (e.g. closing the mobile menu) still run.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const lenis = lenisRef.current?.lenis;
      if (!lenis || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const anchor = (e.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || (anchor.target && anchor.target !== "_self")) return;

      const url = new URL(anchor.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;

      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target) return;

      e.preventDefault();
      lenis.scrollTo(target, { duration: 1.2 });
      history.replaceState(history.state, "", url.hash);
    };
    window.addEventListener("click", onClick, true);
    return () => window.removeEventListener("click", onClick, true);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <ReactLenis root ref={lenisRef} options={{ autoRaf: false, lerp: 0.1, wheelMultiplier: 1 }} />
      {children}
    </MotionConfig>
  );
}
