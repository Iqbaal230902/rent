"use client";

import { motion, type HTMLMotionProps } from "motion/react";

type Tag = "div" | "li" | "article" | "section";

type RevealCardProps = Omit<HTMLMotionProps<"div">, "initial" | "whileInView" | "viewport" | "transition"> & {
  /** Element to render. Default "div". */
  as?: Tag;
  /** Position within a row; delay = index × stagger. */
  index?: number;
  /** Delay per card in seconds. Default 0.1. */
  stagger?: number;
  /** Fraction of the card that must be visible before it animates. Default 0.2. */
  amount?: number;
};

/**
 * Wrapper that makes a card "pop up" when it enters the viewport:
 * opacity 0→1, y 30→0, scale 0.92→1. Runs once (`once: true`).
 *
 * Stagger: pass `index` for cards in one row, e.g.
 *   {items.map((it, i) => <RevealCard key={it.id} index={i}>…</RevealCard>)}
 * Each card watches the viewport on its own, so on mobile (stacked cards) each
 * card still animates exactly when it is scrolled into view.
 */
export function RevealCard({ as = "div", index = 0, stagger = 0.1, amount = 0.2, children, ...rest }: RevealCardProps) {
  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp
      initial={{ opacity: 0, y: 30, scale: 0.92 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 24,
        mass: 0.9,
        delay: index * stagger,
      }}
      {...rest}
    >
      {children}
    </Comp>
  );
}
