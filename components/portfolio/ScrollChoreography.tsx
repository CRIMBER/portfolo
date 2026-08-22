"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

export type ScrollRevealVariant = "fade-up" | "slide-in-left" | "zoom-in" | "blur-in" | "rotate-in";

// Same presetIds as before — only the implementation moved from
// per-card CSS + individual IntersectionObservers to a single Framer
// Motion parent/child stagger, so the whole section reveals as one
// coordinated cascade instead of each card popping in independently
// whenever it happens to cross the viewport edge.
function hiddenState(variant: ScrollRevealVariant, scale: number) {
  switch (variant) {
    case "slide-in-left":
      return { opacity: 0, x: -40 * scale };
    case "zoom-in":
      return { opacity: 0, scale: 0.85 };
    case "blur-in":
      return { opacity: 0, filter: "blur(10px)" };
    case "rotate-in":
      return { opacity: 0, rotate: -6 * scale, scale: 0.96 };
    case "fade-up":
    default:
      return { opacity: 0, y: 24 * scale };
  }
}

const VISIBLE_STATE = { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0, filter: "blur(0px)" };

// Wraps a section (e.g. the projects grid) — when it scrolls into
// view, its ScrollChoreographyItem children reveal in sequence rather
// than all at once.
export function ScrollChoreographyGroup({ scale, children }: { scale: number; children: ReactNode }) {
  const reduced = useReducedMotion();
  if (reduced) return <>{children}</>;

  const container: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 * scale, delayChildren: 0.05 } },
  };
  return (
    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }} variants={container}>
      {children}
    </motion.div>
  );
}

export function ScrollChoreographyItem({
  variant,
  scale,
  children,
}: {
  variant: ScrollRevealVariant;
  scale: number;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <>{children}</>;

  const item: Variants = {
    hidden: hiddenState(variant, scale),
    visible: { ...VISIBLE_STATE, transition: { duration: 0.5 * scale, ease: "easeOut" } },
  };
  return <motion.div variants={item}>{children}</motion.div>;
}
