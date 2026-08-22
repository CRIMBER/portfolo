import { z } from "zod";
import type { ThemeConfig } from "./schema";
import { minimalPreset } from "./presets";
import { INTRO_PRESET_IDS } from "@/lib/intro/registry";
import { ENTRANCE_PRESET_IDS } from "@/lib/canvas/animation-registry";

const designPersonality = z.enum([
  "minimal",
  "editorial",
  "futuristic",
  "cyberpunk",
  "brutalist",
  "glass",
  "retro",
  "experimental",
  "professional",
  "artistic",
  "custom",
]);

const animationIntensity = z.enum(["calm", "smooth", "dynamic", "extreme"]);

const colorConfig = z.object({
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  background: z.string(),
  surface: z.string(),
  text: z.string(),
  textMuted: z.string(),
});

const typographyConfig = z.object({
  headingFont: z.string(),
  bodyFont: z.string(),
  baseSizePx: z.number(),
  scaleRatio: z.number(),
  weight: z.object({ heading: z.number(), body: z.number() }),
});

const backgroundConfig = z.object({
  kind: z.enum(["solid", "gradient", "image", "texture", "particles"]),
  value: z.string(),
  overlayOpacity: z.number().min(0).max(1).optional(),
});

const spacingConfig = z.object({
  density: z.enum(["compact", "comfortable", "spacious"]),
  sectionGapPx: z.number(),
  cardPaddingPx: z.number(),
});

const cardStyleConfig = z.object({
  cornerRadiusPx: z.number(),
  borderWidthPx: z.number(),
  borderColor: z.string().optional(),
  shadow: z.enum(["none", "soft", "hard", "glow"]),
});

const animationTarget = z.enum([
  "pageTransition",
  "heroEntrance",
  "textReveal",
  "scrollReveal",
  "parallax",
  "hover",
  "cardMovement",
  "magnetic",
  "imageTransition",
  "projectTransition",
  "background",
  "particles",
  "cursor",
  "microInteraction",
]);

const animationPreset = z.object({
  target: animationTarget,
  presetId: z.string(),
  intensity: animationIntensity,
  params: z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])).optional(),
});

const animationConfig = z.object({
  globalIntensity: animationIntensity,
  respectReducedMotion: z.literal(true),
  presets: z.array(animationPreset),
});

// Defaulted rather than required: themeConfigs saved before `layout`
// existed won't have it, and they shouldn't get bounced to
// minimalPreset just because of that.
const layoutConfig = z
  .object({ heroAlign: z.enum(["left", "center", "right"]) })
  .default({ heroAlign: "left" });

// Same defaulting story as layoutConfig above: themeConfigs saved
// before the canvas layer existed won't have these fields.
const canvasMode = z.enum(["off", "layer", "replace"]).default("off");
const canvasHeightPx = z.number().min(200).max(20000).default(800);

const introConfig = z
  .object({
    presetId: z
      .string()
      .nullable()
      .refine((id) => id === null || INTRO_PRESET_IDS.includes(id), "Unknown intro preset."),
    durationMs: z.number().min(400).max(15000),
  })
  .default({ presetId: null, durationMs: 2200 });

const reelConfig = z
  .object({
    enabled: z.boolean(),
    transitionPresetId: z.string().refine((id) => ENTRANCE_PRESET_IDS.includes(id), "Unknown reel transition preset."),
    autoAdvanceMs: z.number().min(0).max(30000),
  })
  .default({ enabled: false, transitionPresetId: "fade-in", autoAdvanceMs: 4000 });

const themeConfigSchema = z.object({
  personality: designPersonality,
  colors: colorConfig,
  typography: typographyConfig,
  background: backgroundConfig,
  spacing: spacingConfig,
  cardStyle: cardStyleConfig,
  animation: animationConfig,
  layout: layoutConfig,
  canvasMode,
  canvasHeightPx,
  intro: introConfig,
  reel: reelConfig,
}) satisfies z.ZodType<ThemeConfig>;

// Portfolio.themeConfig is stored as untyped Json — this is the one
// place that boundary gets checked, matching the note in
// prisma/schema.prisma. A member can never get a page render to fail
// by saving a malformed theme; we fall back to the safe default and
// log so it's visible during development.
export function parseThemeConfig(json: unknown): ThemeConfig {
  const result = themeConfigSchema.safeParse(json);
  if (!result.success) {
    console.warn("Invalid ThemeConfig JSON, falling back to minimalPreset:", result.error.message);
    return minimalPreset;
  }
  return result.data;
}

// Used on the *save* path instead — the dashboard's theme studio
// sends a whole ThemeConfig object built client-side, and a server
// action can be called directly (not just via a <form>), so the
// payload isn't guaranteed to match the type even though the client
// is typed against it. This is strict rather than falling back, so a
// bad save surfaces an error instead of silently reverting someone's
// edits to minimalPreset.
export function validateThemeConfig(input: unknown): { ok: true; data: ThemeConfig } | { ok: false; error: string } {
  const result = themeConfigSchema.safeParse(input);
  if (!result.success) {
    return { ok: false, error: result.error.issues[0]?.message ?? "Invalid theme." };
  }
  return { ok: true, data: result.data };
}
