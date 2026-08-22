import type { AnimationIntensity } from "@/lib/theme/schema";

// The free-form layer: members place text/image elements anywhere
// and animate them individually, instead of everything living in
// fixed slots (hero/projects/etc). Same "no arbitrary code" boundary
// as ThemeConfig.animation — a presetId is looked up in
// animation-registry.ts, never executed as member-supplied code.

export type CanvasElementType = "text" | "image" | "widget";
export type CanvasAnimationTrigger = "entrance" | "hover" | "scroll";

// Widgets are a rendering variant of a "text" element, not a new DB
// column — there's no CanvasElementType.WIDGET in the Prisma enum.
// The element persists as ordinary TEXT with its `content` holding a
// JSON envelope (see encodeWidget/decodeWidget) instead of literal
// display text; the app layer recovers "widget" as the effective type
// by decoding `content` on read. Same "no arbitrary code" boundary as
// everywhere else — a member picks a WidgetKind and fills in typed,
// validated fields, never supplies markup or code.
export type WidgetKind = "stat" | "skillbars" | "status" | "marquee";

export const WIDGET_KINDS: WidgetKind[] = ["stat", "skillbars", "status", "marquee"];

export const WIDGET_LABELS: Record<WidgetKind, string> = {
  stat: "Stat counter",
  skillbars: "Skill bars",
  status: "Status pill",
  marquee: "Scrolling ticker",
};

export interface StatWidgetData {
  label: string;
  value: number;
  suffix: string;
}

export interface SkillBarsWidgetData {
  skills: { label: string; pct: number }[];
}

export interface StatusWidgetData {
  label: string;
  state: "available" | "busy" | "away";
}

export interface MarqueeWidgetData {
  text: string;
  speed: "slow" | "medium" | "fast";
}

export type WidgetPayload =
  | { __widget: true; kind: "stat"; data: StatWidgetData }
  | { __widget: true; kind: "skillbars"; data: SkillBarsWidgetData }
  | { __widget: true; kind: "status"; data: StatusWidgetData }
  | { __widget: true; kind: "marquee"; data: MarqueeWidgetData };

export function defaultWidgetData(kind: WidgetKind): WidgetPayload {
  switch (kind) {
    case "stat":
      return { __widget: true, kind, data: { label: "Projects shipped", value: 24, suffix: "+" } };
    case "skillbars":
      return {
        __widget: true,
        kind,
        data: {
          skills: [
            { label: "React", pct: 90 },
            { label: "TypeScript", pct: 85 },
            { label: "Design", pct: 70 },
          ],
        },
      };
    case "status":
      return { __widget: true, kind, data: { label: "Available for work", state: "available" } };
    case "marquee":
      return { __widget: true, kind, data: { text: "Open to freelance · Always building · Let's talk ·", speed: "medium" } };
  }
}

export function encodeWidget(payload: WidgetPayload): string {
  return JSON.stringify(payload);
}

// Returns null for anything that isn't a recognized widget envelope —
// including a plain "text" element whose literal content happens not
// to parse as JSON, which is the overwhelmingly common case.
export function decodeWidget(content: string): WidgetPayload | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return null;
  }
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    (parsed as { __widget?: unknown }).__widget === true &&
    WIDGET_KINDS.includes((parsed as { kind?: unknown }).kind as WidgetKind)
  ) {
    return parsed as WidgetPayload;
  }
  return null;
}

export interface CanvasAnimation {
  trigger: CanvasAnimationTrigger;
  presetId: string;
  intensity: AnimationIntensity;
}

export interface CanvasTextStyle {
  fontFamily: string;
  fontSizePx: number;
  fontWeight: number;
  color: string;
  textAlign: "left" | "center" | "right";
}

export interface CanvasImageStyle {
  objectFit: "cover" | "contain";
  borderRadiusPx: number;
  opacity: number; // 0-1
}

// x/width are percentages of the canvas's fluid width; y/height/
// rotation are pixels/degrees within the canvas's fixed-height box —
// only the width is responsive, so mixing units keeps positions
// stable instead of needing awkward %-of-a-constant math.
export interface CanvasElementData {
  id: string;
  type: CanvasElementType;
  content: string; // text content, an uploaded image URL, or (type "widget") a JSON payload — see encodeWidget/decodeWidget
  xPct: number;
  yPx: number;
  widthPct: number;
  heightPx: number;
  rotationDeg: number;
  zIndex: number;
  textStyle: CanvasTextStyle;
  imageStyle: CanvasImageStyle;
  animations: CanvasAnimation[];
}

export function defaultTextStyle(): CanvasTextStyle {
  return { fontFamily: "Inter", fontSizePx: 24, fontWeight: 600, color: "#f4f4f8", textAlign: "left" };
}

export function defaultImageStyle(): CanvasImageStyle {
  return { objectFit: "cover", borderRadiusPx: 12, opacity: 1 };
}
