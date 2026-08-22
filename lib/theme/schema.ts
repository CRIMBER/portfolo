// The single source of truth for what a portfolio's ThemeConfig can
// contain. Both the dashboard's live preview and the public
// /@username page render from this exact shape through the same
// renderer — that's what keeps preview and reality identical.
//
// Nothing in here allows arbitrary code. Every visual behavior is a
// named preset with typed, bounded params — that's how we support
// wild customization without ever executing member-supplied JS on a
// public page.

export type DesignPersonality =
  | "minimal"
  | "editorial"
  | "futuristic"
  | "cyberpunk"
  | "brutalist"
  | "glass"
  | "retro"
  | "experimental"
  | "professional"
  | "artistic"
  | "custom";

export type AnimationIntensity = "calm" | "smooth" | "dynamic" | "extreme";

export interface ColorConfig {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
}

export interface TypographyConfig {
  headingFont: string;
  bodyFont: string;
  baseSizePx: number;
  scaleRatio: number; // e.g. 1.25 for a minor-third type scale
  weight: { heading: number; body: number };
}

export interface BackgroundConfig {
  kind: "solid" | "gradient" | "image" | "texture" | "particles";
  value: string; // css color/gradient string, or an uploaded asset URL
  overlayOpacity?: number; // 0–1, for legibility over image/particle backgrounds
}

export interface SpacingConfig {
  density: "compact" | "comfortable" | "spacious";
  sectionGapPx: number;
  cardPaddingPx: number;
}

export interface CardStyleConfig {
  cornerRadiusPx: number;
  borderWidthPx: number;
  borderColor?: string;
  shadow: "none" | "soft" | "hard" | "glow";
}

// The fixed set of places animation is allowed to attach. A member
// can pick which preset plays at each target and how intense it is —
// they can never inject a new kind of behavior.
export type AnimationTarget =
  | "pageTransition"
  | "heroEntrance"
  | "textReveal"
  | "scrollReveal"
  | "parallax"
  | "hover"
  | "cardMovement"
  | "magnetic"
  | "imageTransition"
  | "projectTransition"
  | "background"
  | "particles"
  | "cursor"
  | "microInteraction";

export interface AnimationPreset {
  target: AnimationTarget;
  presetId: string; // looked up in a registry of safe, predefined components
  intensity: AnimationIntensity;
  params?: Record<string, number | string | boolean>; // bounded per-preset, validated on save
}

export interface AnimationConfig {
  globalIntensity: AnimationIntensity;
  // Always enforced at render time regardless of member preference —
  // this is an accessibility floor, not a toggle.
  respectReducedMotion: true;
  presets: AnimationPreset[];
}

export interface LayoutConfig {
  heroAlign: "left" | "center" | "right";
}

// "off": no canvas layer. "layer": the structured page (hero/bio/
// projects/social) renders as usual, with a freeform canvas of
// member-placed elements appended below it. "replace": only the
// canvas renders — the structured page is skipped entirely.
export type CanvasMode = "off" | "layer" | "replace";

// A one-time, full-screen sequence that plays before the page reveals
// itself — presetId is looked up in lib/intro/registry.ts, same
// bounded-preset rule as everything else. Only ever plays on the real
// public page (never the dashboard's live preview) and only once per
// browser session per portfolio, tracked client-side.
export interface IntroConfig {
  presetId: string | null;
  durationMs: number;
}

// A "▶ Watch reel" button (shown when enabled and there are 2+
// projects) that opens a full-screen, visitor-driven slideshow —
// separate from page load or scrolling entirely. transitionPresetId
// is looked up in the same entrance-preset catalog canvas elements
// use (lib/canvas/animation-registry.ts) — reused rather than
// duplicated, since "reveal a thing" is the same kind of motion
// either way.
export interface ReelConfig {
  enabled: boolean;
  transitionPresetId: string;
  autoAdvanceMs: number; // 0 = manual navigation only
}

export interface ThemeConfig {
  personality: DesignPersonality;
  colors: ColorConfig;
  typography: TypographyConfig;
  background: BackgroundConfig;
  spacing: SpacingConfig;
  cardStyle: CardStyleConfig;
  animation: AnimationConfig;
  layout: LayoutConfig;
  canvasMode: CanvasMode;
  canvasHeightPx: number;
  intro: IntroConfig;
  reel: ReelConfig;
}
