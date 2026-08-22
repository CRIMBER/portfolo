import type { CSSProperties } from "react";
import styles from "./renderer.module.css";

export type TextRevealVariant = "char-reveal" | "wave";

const VARIANT_CLASS: Record<TextRevealVariant, string> = {
  "char-reveal": styles.charReveal,
  wave: styles.waveChar,
};

// Implements textReveal's two presetIds. Pure CSS (animation-delay
// per span), so this stays a Server Component — no client JS needed.
// Only mounted when that preset is actually configured — see
// PortfolioRenderer.
export function TextReveal({ text, variant, scale }: { text: string; variant: TextRevealVariant; scale: number }) {
  return (
    <span aria-label={text}>
      {[...text].map((char, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={VARIANT_CLASS[variant]}
          style={{ "--char-index": index, "--tc-anim-scale": scale } as CSSProperties}
        >
          {char === " " ? " " : char}
        </span>
      ))}
    </span>
  );
}
