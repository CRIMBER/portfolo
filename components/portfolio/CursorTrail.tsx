"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import styles from "./renderer.module.css";

export type CursorVariant = "trail-glow" | "dot-follow" | "magnetic-ring" | "spotlight";

const VARIANT_CLASS: Record<CursorVariant, string> = {
  "trail-glow": styles.trailGlow,
  "dot-follow": styles.dotFollow,
  "magnetic-ring": styles.magneticRing,
  spotlight: styles.spotlight,
};

// Implements cursor's three presetIds. Only mounted when a cursor
// preset is actually configured — see PortfolioRenderer. Purely a CSS
// custom property follow effect; no member-supplied code involved.
//
// Positioned relative to its own parent (the renderer's root, not the
// viewport) so this behaves the same whether the renderer fills the
// whole page (the public route) or sits in a small embedded preview
// (the dashboard) — coordinates are computed from the parent's own
// bounding rect rather than raw viewport clientX/Y.
export function CursorTrail({ variant, scale }: { variant: CursorVariant; scale: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const handleMove = (event: MouseEvent) => {
      const el = ref.current;
      const container = el?.parentElement;
      if (!el || !container) return;
      const rect = container.getBoundingClientRect();
      el.style.setProperty("--x", String(event.clientX - rect.left));
      el.style.setProperty("--y", String(event.clientY - rect.top));
    };

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return <div ref={ref} className={VARIANT_CLASS[variant]} style={{ "--tc-anim-scale": scale } as CSSProperties} />;
}
