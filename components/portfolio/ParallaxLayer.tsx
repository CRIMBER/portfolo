"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./renderer.module.css";

export type ParallaxVariant = "layered-drift" | "depth-scroll";

// Implements parallax's two presetIds. Only mounted when a parallax
// preset is actually configured — see PortfolioRenderer.
// layered-drift: pure vertical drift. depth-scroll: drift + a subtle
// scale, for more of a "camera pulling back" feel.
export function ParallaxLayer({
  variant,
  factor,
  enabled = true,
  children,
}: {
  variant: ParallaxVariant;
  factor: number;
  // False for the dashboard's embedded preview. This reads
  // window.scrollY, which is the *whole dashboard page's* scroll
  // position when embedded there — a long page means a huge offset
  // gets applied inside a small preview box, shoving the hero down
  // into whatever renders below it. Real scroll-linked parallax only
  // makes sense when this is the actual full page being scrolled.
  enabled?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const offset = window.scrollY * factor;
        el.style.transform =
          variant === "depth-scroll"
            ? `translateY(${offset}px) scale(${1 + Math.min(window.scrollY, 400) * 0.0002})`
            : `translateY(${offset}px)`;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [factor, variant, enabled]);

  return (
    <div ref={ref} className={styles.layeredDrift}>
      {children}
    </div>
  );
}
