"use client";

import { useRef, type MouseEvent, type ReactNode } from "react";
import styles from "./renderer.module.css";

// Implements microInteraction/"pop". Only mounted when that preset is
// actually configured — see PortfolioRenderer.
export function PopOnClick({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = event.currentTarget;
    el.classList.remove(styles.pop);
    // Force reflow so re-adding the class restarts the animation even
    // on rapid repeat clicks.
    void el.offsetWidth;
    el.classList.add(styles.pop);
  };

  return (
    <div ref={ref} onClickCapture={handleClick}>
      {children}
    </div>
  );
}
