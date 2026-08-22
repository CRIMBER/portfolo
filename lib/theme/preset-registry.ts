import type { AnimationTarget } from "./schema";

// The editor-facing catalog of what's actually implemented — every
// entry here has a real CSS/component implementation in
// components/portfolio (see the lookup maps in PortfolioRenderer.tsx
// and renderer.module.css). pageTransition/imageTransition/
// projectTransition aren't listed because nothing renders them yet
// (no multi-page nav or image galleries exist to transition between),
// so they're left out of the editor rather than offering a dead
// option.
export const PRESET_OPTIONS: Partial<Record<AnimationTarget, string[]>> = {
  heroEntrance: ["glitch-in", "fade-scale", "slide-up", "typewriter", "bounce-in"],
  scrollReveal: ["fade-up", "slide-in-left", "zoom-in", "blur-in", "rotate-in"],
  hover: ["subtle-lift", "glow", "tilt", "scale-up", "shine"],
  cardMovement: ["float", "orbit", "pulse", "wobble"],
  background: ["scanlines", "gradient-shift", "noise-grain", "aurora", "starfield"],
  cursor: ["trail-glow", "dot-follow", "magnetic-ring", "spotlight"],
  parallax: ["layered-drift", "depth-scroll"],
  particles: [
    "floating-dots",
    "constellation",
    "snowfall",
    "embers",
    "fireflies",
    "pixels",
    "lightning",
    "smoke",
    "fog",
    "matrix-rain",
  ],
  textReveal: ["char-reveal", "wave"],
  magnetic: ["pull"],
  microInteraction: ["ripple", "pop"],
};

export const TARGET_LABELS: Partial<Record<AnimationTarget, string>> = {
  heroEntrance: "Hero entrance",
  scrollReveal: "Scroll reveal (projects)",
  hover: "Hover (projects)",
  cardMovement: "Card movement (projects)",
  background: "Background effect",
  cursor: "Cursor",
  parallax: "Parallax (hero)",
  particles: "Particles",
  textReveal: "Text reveal (tagline)",
  magnetic: "Magnetic (social links)",
  microInteraction: "Micro-interaction (project click)",
};

export const EDITABLE_TARGETS = Object.keys(PRESET_OPTIONS) as AnimationTarget[];

// Curated rather than free-text — every name here is confirmed to
// exist on Google Fonts, so lib/theme/google-fonts.ts's generated
// <link> always resolves. Spans sans/serif/mono/display so every
// personality has something that fits.
export const FONT_OPTIONS = [
  "Inter",
  "Manrope",
  "DM Sans",
  "Work Sans",
  "Outfit",
  "Space Grotesk",
  "Sora",
  "Syne",
  "Unbounded",
  "Bricolage Grotesque",
  "Archivo Black",
  "Righteous",
  "Orbitron",
  "Rajdhani",
  "Playfair Display",
  "Fraunces",
  "Source Serif 4",
  "Instrument Serif",
  "IBM Plex Mono",
  "Space Mono",
  "JetBrains Mono",
];

export const FONT_WEIGHT_OPTIONS = [300, 400, 500, 600, 700, 800, 900];
