// The editor-facing catalog of implemented intro cutscenes — same
// "member picks a name, never supplies code" boundary as every other
// preset system in this app. See components/intro/IntroOverlay.tsx
// for the actual Framer Motion implementations.
export const INTRO_PRESET_IDS = ["logo-reveal", "glitch-boot", "particle-converge", "typewriter-name", "curtain-wipe"];

export const INTRO_PRESET_LABELS: Record<string, string> = {
  "logo-reveal": "Logo reveal",
  "glitch-boot": "Glitch boot",
  "particle-converge": "Particle converge",
  "typewriter-name": "Typewriter",
  "curtain-wipe": "Curtain wipe",
};
