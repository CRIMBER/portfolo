"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./renderer.module.css";

// Implements magnetic/"pull" — the element drifts toward the cursor
// within a radius, and springs back on mouseleave. Only mounted when
// that preset is actually configured — see PortfolioRenderer.
export function Magnetic({ scale, children }: { scale: number; children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const radius = 60 * scale;
    const strength = 0.35;

    const handleMove = (event: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = event.clientX - cx;
      const dy = event.clientY - cy;
      const distance = Math.hypot(dx, dy);
      if (distance < radius) {
        el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
      } else {
        el.style.transform = "";
      }
    };
    const reset = () => {
      el.style.transform = "";
    };

    window.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", reset);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", reset);
    };
  }, [scale]);

  return (
    <span ref={ref} className={styles.magnetic}>
      {children}
    </span>
  );
}
