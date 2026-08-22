"use client";

import { useRef, type MouseEvent, type ReactNode } from "react";
import styles from "./renderer.module.css";

// Implements microInteraction/"ripple". Only mounted when that preset
// is actually configured — see PortfolioRenderer.
export function Ripple({ scale, children }: { scale: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const container = ref.current;
    if (!container || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = container.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.6 * scale;
    const dot = document.createElement("span");
    dot.className = styles.rippleDot;
    dot.style.width = `${size}px`;
    dot.style.height = `${size}px`;
    dot.style.left = `${event.clientX - rect.left}px`;
    dot.style.top = `${event.clientY - rect.top}px`;
    container.appendChild(dot);
    dot.addEventListener("animationend", () => dot.remove());
  };

  return (
    <div ref={ref} className={styles.rippleContainer} onClickCapture={handleClick}>
      {children}
    </div>
  );
}
