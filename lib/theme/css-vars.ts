import type { CSSProperties } from "react";
import type { ThemeConfig } from "./schema";
import { parseColor } from "./color";

function shadowValue(theme: ThemeConfig): string {
  switch (theme.cardStyle.shadow) {
    case "none":
      return "none";
    case "soft":
      return "0 4px 20px rgba(0,0,0,0.08)";
    case "hard":
      return `4px 4px 0 ${theme.colors.text}`;
    case "glow":
      return `0 0 24px ${theme.colors.primary}`;
  }
}

function backgroundValue(theme: ThemeConfig): string {
  const { kind, value } = theme.background;
  if (kind === "solid" || kind === "gradient") return value;
  if (kind === "image" || kind === "texture") return `center / cover no-repeat url("${value}")`;
  // "particles" here is a legacy background.kind value the studio UI
  // never actually writes — the real particle-field feature lives at
  // animation target "particles" (10 variants, see Particles.tsx),
  // rendered as a full-bleed canvas behind the page content regardless
  // of this background.kind. Fall back to the flat surface color so a
  // theme carrying this value still renders correctly.
  return theme.colors.background;
}

// Floor is 60% of the desktop size (never so small the heading loses
// hierarchy), ceiling is the member's actual chosen size — the vw
// term is what actually shrinks it down on narrow viewports.
function headingClamp(desktopPx: number, vw: number): string {
  return `clamp(${(desktopPx * 0.6).toFixed(1)}px, ${vw}vw, ${desktopPx.toFixed(1)}px)`;
}

const ALIGN_ITEMS: Record<ThemeConfig["layout"]["heroAlign"], string> = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
};

// Glassmorphism isn't a preset a member picks — it falls out
// automatically from how transparent they make the surface color.
// Any surface with alpha < 1 gets a backdrop blur behind it, scaled
// by how transparent it is, which is what makes a translucent card
// actually read as "glass" instead of just a faint tint.
function cardBackdropBlur(theme: ThemeConfig): string {
  const { alpha } = parseColor(theme.colors.surface);
  if (alpha >= 1) return "none";
  const blurPx = Math.round(6 + (1 - alpha) * 20);
  // saturate() alongside the blur is what actually reads as "tinted
  // glass" rather than just a smudged/frosted window — it pushes the
  // blurred colors showing through to be richer instead of washed out,
  // which a blur alone tends to look like.
  return `blur(${blurPx}px) saturate(160%)`;
}

// The single mapping from ThemeConfig to actual pixels: every visual
// property a member can set flows through this function into CSS
// custom properties, which renderer.module.css then consumes. This
// runs identically for the public page and (once it exists) the
// dashboard's live preview, so the two can never drift apart.
export function themeToStyle(theme: ThemeConfig): CSSProperties {
  return {
    "--tc-color-primary": theme.colors.primary,
    "--tc-color-secondary": theme.colors.secondary,
    "--tc-color-accent": theme.colors.accent,
    "--tc-color-background": theme.colors.background,
    "--tc-color-surface": theme.colors.surface,
    "--tc-color-text": theme.colors.text,
    "--tc-color-text-muted": theme.colors.textMuted,

    "--tc-font-heading": `"${theme.typography.headingFont}", system-ui, sans-serif`,
    "--tc-font-body": `"${theme.typography.bodyFont}", system-ui, sans-serif`,
    "--tc-weight-heading": theme.typography.weight.heading,
    "--tc-weight-body": theme.typography.weight.body,
    "--tc-size-body": `${theme.typography.baseSizePx}px`,
    // clamp() so a high base-size + scale-ratio combo (up to ~74px for
    // h1) doesn't just render at that literal size on a narrow phone —
    // it scales down with viewport width, capped at the member's
    // chosen size on wider screens.
    "--tc-size-h1": headingClamp(theme.typography.baseSizePx * theme.typography.scaleRatio ** 3, 9),
    "--tc-size-h2": headingClamp(theme.typography.baseSizePx * theme.typography.scaleRatio ** 2, 6),
    "--tc-size-h3": `${theme.typography.baseSizePx * theme.typography.scaleRatio}px`,

    "--tc-background": backgroundValue(theme),
    "--tc-overlay-opacity": theme.background.overlayOpacity ?? 0,

    "--tc-section-gap": `${theme.spacing.sectionGapPx}px`,
    "--tc-card-padding": `${theme.spacing.cardPaddingPx}px`,

    "--tc-card-radius": `${theme.cardStyle.cornerRadiusPx}px`,
    "--tc-card-border-width": `${theme.cardStyle.borderWidthPx}px`,
    "--tc-card-border-color": theme.cardStyle.borderColor ?? "transparent",
    "--tc-card-shadow": shadowValue(theme),
    "--tc-card-blur": cardBackdropBlur(theme),

    "--tc-align-items": ALIGN_ITEMS[theme.layout.heroAlign],
    "--tc-text-align": theme.layout.heroAlign,

    "--tc-scrollbar-thumb": theme.colors.primary,
    "--tc-scrollbar-track": theme.colors.surface,
  } as CSSProperties;
}
