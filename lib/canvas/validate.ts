import { z } from "zod";
import type { CanvasElementData } from "./schema";
import { decodeWidget, defaultImageStyle, defaultTextStyle } from "./schema";
import { ENTRANCE_PRESET_IDS, HOVER_PRESET_IDS, SCROLL_PRESET_IDS } from "./animation-registry";

const statWidgetData = z.object({
  label: z.string().trim().min(1).max(60),
  value: z.number().min(-999999).max(999999),
  suffix: z.string().trim().max(10),
});
const skillBarsWidgetData = z.object({
  skills: z
    .array(z.object({ label: z.string().trim().min(1).max(40), pct: z.number().min(0).max(100) }))
    .min(1)
    .max(8),
});
const statusWidgetData = z.object({
  label: z.string().trim().min(1).max(60),
  state: z.enum(["available", "busy", "away"]),
});
const marqueeWidgetData = z.object({
  text: z.string().trim().min(1).max(300),
  speed: z.enum(["slow", "medium", "fast"]),
});

const widgetPayloadSchema = z.discriminatedUnion("kind", [
  z.object({ __widget: z.literal(true), kind: z.literal("stat"), data: statWidgetData }),
  z.object({ __widget: z.literal(true), kind: z.literal("skillbars"), data: skillBarsWidgetData }),
  z.object({ __widget: z.literal(true), kind: z.literal("status"), data: statusWidgetData }),
  z.object({ __widget: z.literal(true), kind: z.literal("marquee"), data: marqueeWidgetData }),
]);

const animationIntensity = z.enum(["calm", "smooth", "dynamic", "extreme"]);

const canvasAnimation = z
  .object({
    trigger: z.enum(["entrance", "hover", "scroll"]),
    presetId: z.string(),
    intensity: animationIntensity,
  })
  .refine((a) => {
    const allowed = a.trigger === "entrance" ? ENTRANCE_PRESET_IDS : a.trigger === "scroll" ? SCROLL_PRESET_IDS : HOVER_PRESET_IDS;
    return allowed.includes(a.presetId);
  }, "Unknown animation preset for that trigger.");

const canvasTextStyle = z.object({
  fontFamily: z.string().min(1).max(60),
  fontSizePx: z.number().min(8).max(200),
  fontWeight: z.number().int().min(100).max(900),
  color: z.string().min(1).max(60),
  textAlign: z.enum(["left", "center", "right"]),
});

const canvasImageStyle = z.object({
  objectFit: z.enum(["cover", "contain"]),
  borderRadiusPx: z.number().min(0).max(400),
  opacity: z.number().min(0).max(1),
});

// One entry per trigger at most — a member can set an entrance, a
// hover, and a scroll reveal on the same element, but not two
// competing presets for the same trigger.
const canvasAnimations = z.array(canvasAnimation).max(3).refine((animations) => {
  const triggers = animations.map((a) => a.trigger);
  return new Set(triggers).size === triggers.length;
}, "Only one preset per trigger.");

const canvasElementSchema = z
  .object({
    id: z.string().min(1).max(64),
    type: z.enum(["text", "image", "widget"]),
    content: z.string().max(4000),
    xPct: z.number().min(-20).max(120),
    yPx: z.number().min(-2000).max(20000),
    widthPct: z.number().min(2).max(100),
    heightPx: z.number().min(10).max(4000),
    rotationDeg: z.number().min(-180).max(180),
    zIndex: z.number().int().min(0).max(1000),
    textStyle: canvasTextStyle,
    imageStyle: canvasImageStyle,
    animations: canvasAnimations,
  })
  .superRefine((el, ctx) => {
    // Widgets persist as an ordinary "text" element whose content is a
    // JSON envelope (see schema.ts) — not a real DB type — so this is
    // the one place that actually enforces a widget's content is
    // well-formed before it's allowed to save.
    if (el.type !== "widget") return;
    const parsed = widgetPayloadSchema.safeParse(safeContent(el.content));
    if (!parsed.success) {
      ctx.addIssue({ code: "custom", message: "Invalid widget data.", path: ["content"] });
    }
  }) satisfies z.ZodType<CanvasElementData>;

function safeContent(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

const canvasElementsSchema = z.array(canvasElementSchema).max(60);

// Strict — used on the save path. A member's whole element list is
// sent from client state on every save, so this must actually reject
// bad data rather than silently coerce it.
export function validateCanvasElements(
  input: unknown,
): { ok: true; data: CanvasElementData[] } | { ok: false; error: string } {
  const result = canvasElementsSchema.safeParse(input);
  if (!result.success) {
    return { ok: false, error: result.error.issues[0]?.message ?? "Invalid canvas elements." };
  }
  return { ok: true, data: result.data };
}

// Lenient — used on the render path. A row that fails validation
// (e.g. hand-edited DB data) is dropped rather than failing the whole
// page render.
export function parseCanvasElement(row: {
  id: string;
  type: "TEXT" | "IMAGE";
  content: string;
  xPct: number;
  yPx: number;
  widthPct: number;
  heightPx: number;
  rotationDeg: number;
  zIndex: number;
  style: unknown;
  animations: unknown;
}): CanvasElementData | null {
  // A widget row persists with row.type "TEXT" (see schema.ts) — the
  // only way to tell it apart from an ordinary text element is that
  // its content decodes as a recognized widget envelope.
  const isWidget = row.type === "TEXT" && decodeWidget(row.content) !== null;
  const type = isWidget ? "widget" : row.type === "TEXT" ? "text" : "image";
  // Widgets reuse the text style slot (label/foreground color, font)
  // the same way they reuse row.type "TEXT".
  const styleResult = type === "image" ? canvasImageStyle.safeParse(row.style) : canvasTextStyle.safeParse(row.style);
  const animationsResult = canvasAnimations.safeParse(row.animations);
  const typeResult = z.enum(["text", "image", "widget"]).safeParse(type);
  if (!typeResult.success || !animationsResult.success) return null;
  if (isWidget && widgetPayloadSchema.safeParse(safeContent(row.content)).success === false) return null;

  return {
    id: row.id,
    type: typeResult.data,
    content: row.content,
    xPct: row.xPct,
    yPx: row.yPx,
    widthPct: row.widthPct,
    heightPx: row.heightPx,
    rotationDeg: row.rotationDeg,
    zIndex: row.zIndex,
    textStyle: typeResult.data !== "image" && styleResult.success ? (styleResult.data as CanvasElementData["textStyle"]) : defaultTextStyle(),
    imageStyle:
      typeResult.data === "image" && styleResult.success ? (styleResult.data as CanvasElementData["imageStyle"]) : defaultImageStyle(),
    animations: animationsResult.data,
  };
}
