import type { Transition, TargetAndTransition } from "framer-motion";

// Bounded, named Framer Motion presets — the canvas equivalent of
// lib/theme/preset-registry.ts. A member only ever selects a
// presetId; the actual motion values/springs live here and nowhere
// else, so no member-supplied code ever runs on the public page.

export const ENTRANCE_PRESET_IDS = [
  "fade-in",
  "slide-up",
  "slide-down",
  "slide-left",
  "slide-right",
  "zoom-in",
  "spring-pop",
  "flip-in",
  "blur-in",
  "rotate-in",
  "swing-in",
  "elastic-in",
  "drop-in",
  "skew-in",
];

// Scroll-triggered reveal shares the same visual catalog as entrance
// — they only differ in *when* they fire (on mount vs on scrolling
// into view) — see entranceMotionProps.
export const SCROLL_PRESET_IDS = ENTRANCE_PRESET_IDS;

export const HOVER_PRESET_IDS = ["lift", "scale", "tilt", "glow-pulse", "shake", "float", "wobble", "brighten", "flip"];

interface EntranceMotion {
  initial: TargetAndTransition;
  animate: TargetAndTransition;
  transition: Transition;
}

export function entranceMotionProps(presetId: string, scale: number): EntranceMotion {
  const duration = 0.5 * scale;
  switch (presetId) {
    case "slide-up":
      return { initial: { opacity: 0, y: 36 * scale }, animate: { opacity: 1, y: 0 }, transition: { duration, ease: "easeOut" } };
    case "slide-down":
      return { initial: { opacity: 0, y: -36 * scale }, animate: { opacity: 1, y: 0 }, transition: { duration, ease: "easeOut" } };
    case "slide-left":
      return { initial: { opacity: 0, x: 36 * scale }, animate: { opacity: 1, x: 0 }, transition: { duration, ease: "easeOut" } };
    case "slide-right":
      return { initial: { opacity: 0, x: -36 * scale }, animate: { opacity: 1, x: 0 }, transition: { duration, ease: "easeOut" } };
    case "zoom-in":
      return { initial: { opacity: 0, scale: 0.7 }, animate: { opacity: 1, scale: 1 }, transition: { duration, ease: "easeOut" } };
    case "spring-pop":
      return {
        initial: { opacity: 0, scale: 0.5 },
        animate: { opacity: 1, scale: 1 },
        transition: { type: "spring", stiffness: 260, damping: Math.max(6, 18 / scale) },
      };
    case "flip-in":
      return {
        initial: { opacity: 0, rotateX: -90 },
        animate: { opacity: 1, rotateX: 0 },
        transition: { duration, ease: "easeOut" },
      };
    case "blur-in":
      return {
        initial: { opacity: 0, filter: "blur(14px)" },
        animate: { opacity: 1, filter: "blur(0px)" },
        transition: { duration: duration * 1.2, ease: "easeOut" },
      };
    case "rotate-in":
      return {
        initial: { opacity: 0, rotate: -14 * scale },
        animate: { opacity: 1, rotate: 0 },
        transition: { duration, ease: "easeOut" },
      };
    case "swing-in":
      return {
        initial: { opacity: 0, rotate: -20 * scale, y: -20 * scale },
        animate: { opacity: 1, rotate: 0, y: 0 },
        transition: { type: "spring", stiffness: 180, damping: Math.max(8, 14 / scale) },
      };
    case "elastic-in":
      return {
        initial: { opacity: 0, scale: 0.3 },
        animate: { opacity: 1, scale: 1 },
        transition: { type: "spring", stiffness: 400, damping: Math.max(5, 10 / scale) },
      };
    case "drop-in":
      return {
        initial: { opacity: 0, y: -80 * scale },
        animate: { opacity: 1, y: 0 },
        transition: { type: "spring", stiffness: 300, damping: Math.max(10, 20 / scale) },
      };
    case "skew-in":
      return {
        initial: { opacity: 0, skewX: -15 * scale, x: -20 * scale },
        animate: { opacity: 1, skewX: 0, x: 0 },
        transition: { duration, ease: "easeOut" },
      };
    case "fade-in":
    default:
      return { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration, ease: "easeOut" } };
  }
}

export function hoverMotionProps(presetId: string, scale: number): TargetAndTransition {
  switch (presetId) {
    case "scale":
      return { scale: 1 + 0.08 * scale, transition: { duration: 0.25, ease: "easeOut" } };
    case "tilt":
      return { rotate: 4 * scale, transition: { duration: 0.25, ease: "easeOut" } };
    case "glow-pulse":
      return {
        scale: 1 + 0.03 * scale,
        filter: `drop-shadow(0 0 ${12 * scale}px currentColor)`,
        transition: { duration: 0.3, ease: "easeOut" },
      };
    case "shake":
      return { x: [0, -4 * scale, 4 * scale, -3 * scale, 0], transition: { duration: 0.4, ease: "easeInOut" } };
    case "float":
      return { y: [0, -6 * scale, 0], transition: { duration: 0.9, repeat: Infinity, ease: "easeInOut" } };
    case "wobble":
      return { rotate: [0, -4 * scale, 4 * scale, -3 * scale, 0], transition: { duration: 0.5, ease: "easeInOut" } };
    case "brighten":
      return { filter: "brightness(1.15)", scale: 1 + 0.02 * scale, transition: { duration: 0.25, ease: "easeOut" } };
    case "flip":
      return { rotateY: 15 * scale, transition: { duration: 0.3, ease: "easeOut" } };
    case "lift":
    default:
      return { y: -8 * scale, transition: { duration: 0.25, ease: "easeOut" } };
  }
}
