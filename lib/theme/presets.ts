import type { ThemeConfig } from "./schema";

// Starting points, not restrictions (per spec section 6) — every
// field here stays fully editable in the dashboard. These exist so
// there's a real, populated ThemeConfig on day one, and so the
// renderer has something concrete to render against while it's
// being built.

export const minimalPreset: ThemeConfig = {
  personality: "minimal",
  colors: {
    primary: "#111111",
    secondary: "#666666",
    accent: "#111111",
    background: "#ffffff",
    surface: "#fafafa",
    text: "#111111",
    textMuted: "#767676",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    baseSizePx: 16,
    scaleRatio: 1.2,
    weight: { heading: 600, body: 400 },
  },
  background: { kind: "solid", value: "#ffffff" },
  spacing: { density: "spacious", sectionGapPx: 96, cardPaddingPx: 24 },
  cardStyle: { cornerRadiusPx: 4, borderWidthPx: 1, borderColor: "#eaeaea", shadow: "none" },
  animation: {
    globalIntensity: "calm",
    respectReducedMotion: true,
    presets: [
      { target: "scrollReveal", presetId: "fade-up", intensity: "calm" },
      { target: "hover", presetId: "subtle-lift", intensity: "calm" },
    ],
  },
  layout: { heroAlign: "left" },
  canvasMode: "off",
  canvasHeightPx: 800,
  intro: { presetId: null, durationMs: 2200 },
  qrIntro: { presetId: null, durationMs: 1800 },
  reel: { enabled: false, transitionPresetId: "fade-in", autoAdvanceMs: 4000 },
  music: { url: null, volume: 0.5, autoplay: true },
};

export const cyberpunkPreset: ThemeConfig = {
  personality: "cyberpunk",
  colors: {
    primary: "#ff2e63",
    secondary: "#08d9d6",
    accent: "#eaeaea",
    background: "#0d0d0d",
    surface: "#151515",
    text: "#eaeaea",
    textMuted: "#8a8a8a",
  },
  typography: {
    headingFont: "Space Grotesk",
    bodyFont: "IBM Plex Mono",
    baseSizePx: 16,
    scaleRatio: 1.333,
    weight: { heading: 700, body: 400 },
  },
  background: { kind: "gradient", value: "linear-gradient(135deg, #0d0d0d, #1a0d1f)" },
  spacing: { density: "comfortable", sectionGapPx: 72, cardPaddingPx: 20 },
  cardStyle: { cornerRadiusPx: 2, borderWidthPx: 1, borderColor: "#ff2e63", shadow: "glow" },
  animation: {
    globalIntensity: "dynamic",
    respectReducedMotion: true,
    presets: [
      { target: "heroEntrance", presetId: "glitch-in", intensity: "dynamic" },
      { target: "cursor", presetId: "trail-glow", intensity: "dynamic" },
      { target: "background", presetId: "scanlines", intensity: "smooth" },
    ],
  },
  layout: { heroAlign: "left" },
  canvasMode: "off",
  canvasHeightPx: 800,
  intro: { presetId: null, durationMs: 2200 },
  qrIntro: { presetId: null, durationMs: 1800 },
  reel: { enabled: false, transitionPresetId: "fade-in", autoAdvanceMs: 4000 },
  music: { url: null, volume: 0.5, autoplay: true },
};

export const glassPreset: ThemeConfig = {
  personality: "glass",
  colors: {
    primary: "#7f9cf5",
    secondary: "#a78bfa",
    accent: "#ffffff",
    background: "#e8ecf7",
    surface: "rgba(255,255,255,0.55)",
    text: "#1e2233",
    textMuted: "#5b6072",
  },
  typography: {
    headingFont: "Sora",
    bodyFont: "Inter",
    baseSizePx: 16,
    scaleRatio: 1.25,
    weight: { heading: 600, body: 400 },
  },
  background: { kind: "gradient", value: "linear-gradient(160deg, #dfe7fb, #f3e8fb)" },
  spacing: { density: "comfortable", sectionGapPx: 80, cardPaddingPx: 28 },
  cardStyle: { cornerRadiusPx: 20, borderWidthPx: 1, borderColor: "rgba(255,255,255,0.4)", shadow: "soft" },
  animation: {
    globalIntensity: "smooth",
    respectReducedMotion: true,
    presets: [
      { target: "parallax", presetId: "layered-drift", intensity: "smooth" },
      { target: "cardMovement", presetId: "float", intensity: "calm" },
      // Genuine glassmorphism needs something with real texture behind
      // the blurred card, or backdrop-filter just softens a flat
      // gradient into... a slightly softer flat gradient. Three slow
      // drifting color blobs (in the theme's own primary/secondary/
      // accent) give the blur actual light and color to distort.
      { target: "background", presetId: "aurora", intensity: "smooth" },
    ],
  },
  layout: { heroAlign: "center" },
  canvasMode: "off",
  canvasHeightPx: 800,
  intro: { presetId: null, durationMs: 2200 },
  qrIntro: { presetId: null, durationMs: 1800 },
  reel: { enabled: false, transitionPresetId: "fade-in", autoAdvanceMs: 4000 },
  music: { url: null, volume: 0.5, autoplay: true },
};

export const editorialPreset: ThemeConfig = {
  personality: "editorial",
  colors: {
    primary: "#1a1a1a",
    secondary: "#a3742c",
    accent: "#a3742c",
    background: "#faf6ee",
    surface: "#ffffff",
    text: "#1a1a1a",
    textMuted: "#6b6459",
  },
  typography: {
    headingFont: "Playfair Display",
    bodyFont: "Source Serif 4",
    baseSizePx: 18,
    scaleRatio: 1.333,
    weight: { heading: 700, body: 400 },
  },
  background: { kind: "solid", value: "#faf6ee" },
  spacing: { density: "spacious", sectionGapPx: 112, cardPaddingPx: 32 },
  cardStyle: { cornerRadiusPx: 0, borderWidthPx: 1, borderColor: "#e4ddcf", shadow: "soft" },
  animation: {
    globalIntensity: "calm",
    respectReducedMotion: true,
    presets: [
      { target: "scrollReveal", presetId: "blur-in", intensity: "calm" },
      { target: "hover", presetId: "scale-up", intensity: "calm" },
    ],
  },
  layout: { heroAlign: "left" },
  canvasMode: "off",
  canvasHeightPx: 800,
  intro: { presetId: null, durationMs: 2200 },
  qrIntro: { presetId: null, durationMs: 1800 },
  reel: { enabled: false, transitionPresetId: "fade-in", autoAdvanceMs: 4000 },
  music: { url: null, volume: 0.5, autoplay: true },
};

export const futuristicPreset: ThemeConfig = {
  personality: "futuristic",
  colors: {
    primary: "#00e5ff",
    secondary: "#7c4dff",
    accent: "#ffffff",
    background: "#050810",
    surface: "#0d1420",
    text: "#e8f6ff",
    textMuted: "#7f93ab",
  },
  typography: {
    headingFont: "Orbitron",
    bodyFont: "Rajdhani",
    baseSizePx: 16,
    scaleRatio: 1.3,
    weight: { heading: 700, body: 500 },
  },
  background: { kind: "gradient", value: "linear-gradient(160deg, #050810, #0d1a2e)" },
  spacing: { density: "comfortable", sectionGapPx: 80, cardPaddingPx: 24 },
  cardStyle: { cornerRadiusPx: 12, borderWidthPx: 1, borderColor: "#1c4a63", shadow: "glow" },
  animation: {
    globalIntensity: "dynamic",
    respectReducedMotion: true,
    presets: [
      { target: "heroEntrance", presetId: "fade-scale", intensity: "dynamic" },
      { target: "background", presetId: "aurora", intensity: "smooth" },
      { target: "cursor", presetId: "dot-follow", intensity: "smooth" },
      { target: "parallax", presetId: "depth-scroll", intensity: "smooth" },
    ],
  },
  layout: { heroAlign: "center" },
  canvasMode: "off",
  canvasHeightPx: 800,
  intro: { presetId: null, durationMs: 2200 },
  qrIntro: { presetId: null, durationMs: 1800 },
  reel: { enabled: false, transitionPresetId: "fade-in", autoAdvanceMs: 4000 },
  music: { url: null, volume: 0.5, autoplay: true },
};

export const brutalistPreset: ThemeConfig = {
  personality: "brutalist",
  colors: {
    primary: "#000000",
    secondary: "#8a7000",
    accent: "#ffe600",
    background: "#ffffff",
    surface: "#ffffff",
    text: "#000000",
    textMuted: "#3a3a3a",
  },
  typography: {
    headingFont: "Archivo Black",
    bodyFont: "Arial",
    baseSizePx: 18,
    scaleRatio: 1.4,
    weight: { heading: 900, body: 500 },
  },
  background: { kind: "solid", value: "#ffffff" },
  spacing: { density: "compact", sectionGapPx: 56, cardPaddingPx: 20 },
  cardStyle: { cornerRadiusPx: 0, borderWidthPx: 3, borderColor: "#000000", shadow: "hard" },
  animation: {
    globalIntensity: "dynamic",
    respectReducedMotion: true,
    presets: [
      { target: "hover", presetId: "tilt", intensity: "dynamic" },
      { target: "cardMovement", presetId: "pulse", intensity: "calm" },
      { target: "microInteraction", presetId: "ripple", intensity: "dynamic" },
    ],
  },
  layout: { heroAlign: "left" },
  canvasMode: "off",
  canvasHeightPx: 800,
  intro: { presetId: null, durationMs: 2200 },
  qrIntro: { presetId: null, durationMs: 1800 },
  reel: { enabled: false, transitionPresetId: "fade-in", autoAdvanceMs: 4000 },
  music: { url: null, volume: 0.5, autoplay: true },
};

export const retroPreset: ThemeConfig = {
  personality: "retro",
  colors: {
    primary: "#e8622c",
    secondary: "#b8860f",
    accent: "#8c4843",
    background: "#f5e6d3",
    surface: "#fff6e9",
    text: "#3d2b1f",
    textMuted: "#7a6350",
  },
  typography: {
    headingFont: "Righteous",
    bodyFont: "Poppins",
    baseSizePx: 17,
    scaleRatio: 1.25,
    weight: { heading: 600, body: 400 },
  },
  background: { kind: "gradient", value: "linear-gradient(180deg, #f5e6d3, #ecd3b0)" },
  spacing: { density: "comfortable", sectionGapPx: 72, cardPaddingPx: 24 },
  cardStyle: { cornerRadiusPx: 16, borderWidthPx: 2, borderColor: "#e8622c", shadow: "soft" },
  animation: {
    globalIntensity: "smooth",
    respectReducedMotion: true,
    presets: [
      { target: "textReveal", presetId: "char-reveal", intensity: "smooth" },
      { target: "hover", presetId: "glow", intensity: "smooth" },
      { target: "background", presetId: "noise-grain", intensity: "calm" },
    ],
  },
  layout: { heroAlign: "center" },
  canvasMode: "off",
  canvasHeightPx: 800,
  intro: { presetId: null, durationMs: 2200 },
  qrIntro: { presetId: null, durationMs: 1800 },
  reel: { enabled: false, transitionPresetId: "fade-in", autoAdvanceMs: 4000 },
  music: { url: null, volume: 0.5, autoplay: true },
};

export const experimentalPreset: ThemeConfig = {
  personality: "experimental",
  colors: {
    primary: "#ff4de0",
    secondary: "#18b294",
    accent: "#ffe74d",
    background: "#0a0a12",
    surface: "#15151f",
    text: "#f5f5ff",
    textMuted: "#a3a3c2",
  },
  typography: {
    headingFont: "Unbounded",
    bodyFont: "Space Mono",
    baseSizePx: 16,
    scaleRatio: 1.4,
    weight: { heading: 800, body: 400 },
  },
  background: { kind: "solid", value: "#0a0a12" },
  spacing: { density: "compact", sectionGapPx: 64, cardPaddingPx: 20 },
  cardStyle: { cornerRadiusPx: 24, borderWidthPx: 2, borderColor: "#ff4de0", shadow: "glow" },
  animation: {
    globalIntensity: "extreme",
    respectReducedMotion: true,
    presets: [
      { target: "particles", presetId: "floating-dots", intensity: "dynamic" },
      { target: "scrollReveal", presetId: "zoom-in", intensity: "extreme" },
      { target: "cursor", presetId: "magnetic-ring", intensity: "dynamic" },
    ],
  },
  layout: { heroAlign: "center" },
  canvasMode: "off",
  canvasHeightPx: 800,
  intro: { presetId: null, durationMs: 2200 },
  qrIntro: { presetId: null, durationMs: 1800 },
  reel: { enabled: false, transitionPresetId: "fade-in", autoAdvanceMs: 4000 },
  music: { url: null, volume: 0.5, autoplay: true },
};

export const professionalPreset: ThemeConfig = {
  personality: "professional",
  colors: {
    primary: "#0a5cd8",
    secondary: "#425466",
    accent: "#0a5cd8",
    background: "#ffffff",
    surface: "#f7f9fc",
    text: "#1a1f36",
    textMuted: "#697386",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    baseSizePx: 16,
    scaleRatio: 1.2,
    weight: { heading: 700, body: 400 },
  },
  background: { kind: "solid", value: "#ffffff" },
  spacing: { density: "comfortable", sectionGapPx: 72, cardPaddingPx: 24 },
  cardStyle: { cornerRadiusPx: 8, borderWidthPx: 1, borderColor: "#e3e8ef", shadow: "soft" },
  animation: {
    globalIntensity: "calm",
    respectReducedMotion: true,
    presets: [
      { target: "scrollReveal", presetId: "fade-up", intensity: "calm" },
      { target: "hover", presetId: "subtle-lift", intensity: "calm" },
    ],
  },
  layout: { heroAlign: "left" },
  canvasMode: "off",
  canvasHeightPx: 800,
  intro: { presetId: null, durationMs: 2200 },
  qrIntro: { presetId: null, durationMs: 1800 },
  reel: { enabled: false, transitionPresetId: "fade-in", autoAdvanceMs: 4000 },
  music: { url: null, volume: 0.5, autoplay: true },
};

export const artisticPreset: ThemeConfig = {
  personality: "artistic",
  colors: {
    primary: "#c026d3",
    secondary: "#f97316",
    accent: "#facc15",
    background: "#1a0b1f",
    surface: "#2a1230",
    text: "#fdf4ff",
    textMuted: "#c9a8d1",
  },
  typography: {
    headingFont: "Fraunces",
    bodyFont: "Work Sans",
    baseSizePx: 17,
    scaleRatio: 1.35,
    weight: { heading: 600, body: 400 },
  },
  background: { kind: "gradient", value: "linear-gradient(140deg, #1a0b1f, #391734, #1a0b1f)" },
  spacing: { density: "spacious", sectionGapPx: 96, cardPaddingPx: 28 },
  cardStyle: { cornerRadiusPx: 28, borderWidthPx: 0, shadow: "glow" },
  animation: {
    globalIntensity: "dynamic",
    respectReducedMotion: true,
    presets: [
      { target: "cardMovement", presetId: "orbit", intensity: "smooth" },
      { target: "hover", presetId: "tilt", intensity: "smooth" },
      { target: "magnetic", presetId: "pull", intensity: "smooth" },
    ],
  },
  layout: { heroAlign: "center" },
  canvasMode: "off",
  canvasHeightPx: 800,
  intro: { presetId: null, durationMs: 2200 },
  qrIntro: { presetId: null, durationMs: 1800 },
  reel: { enabled: false, transitionPresetId: "fade-in", autoAdvanceMs: 4000 },
  music: { url: null, volume: 0.5, autoplay: true },
};

export const startingPresets: Record<string, ThemeConfig> = {
  minimal: minimalPreset,
  cyberpunk: cyberpunkPreset,
  glass: glassPreset,
  editorial: editorialPreset,
  futuristic: futuristicPreset,
  brutalist: brutalistPreset,
  retro: retroPreset,
  experimental: experimentalPreset,
  professional: professionalPreset,
  artistic: artisticPreset,
};
