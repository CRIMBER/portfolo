import type { CanvasElementData, CanvasTextStyle, WidgetPayload } from "./schema";
import { defaultImageStyle, defaultTextStyle, encodeWidget } from "./schema";

// Premade starting layouts for the Canvas tab — same "pick one to
// seed things, then tweak freely" idea as lib/theme/presets.ts, just
// producing CanvasElementData[] instead of a ThemeConfig. Kept to
// text + widget elements only (no "image" elements): a template has
// to render correctly the instant it's applied, and there's no
// generic placeholder image to point one at.

interface Rect {
  xPct: number;
  yPx: number;
  widthPct: number;
  heightPx: number;
}

// A fresh id per call (not baked into the template data) so applying
// the same template twice — or applying one on top of another —
// never produces duplicate element ids. Same shape as portfolio-
// studio.tsx's newId(), just distinguishable in a debugger as
// template-sourced.
function templateId(): string {
  return `tpl-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

// Two lessons learned from testing this against the Studio's actual
// narrow preview width (not just a wide desktop viewport, which
// hides both of these):
//
// 1. CanvasElementView renders "text" elements with white-space:
//    pre-wrap — text wraps rather than overflowing sideways, but the
//    box's heightPx is fixed and clips (overflow: hidden) whatever
//    falls below it. widthPct is a % of the canvas's fluid width, so
//    a box that fits its content on one line at a wide desktop width
//    can force two or three lines on a phone or the Studio's own
//    narrower preview column — and a wrapped line that falls outside
//    too-short a heightPx doesn't truncate visibly, it just silently
//    vanishes. Every text box below is sized assuming a generous
//    worst-case line count at fontSizePx * ~1.5 line-height, not
//    sized to its single-line content at desktop width.
// 2. Neither a status pill's label nor a stat widget's big number
//    shrinks or wraps to fit a narrower box (both are effectively
//    single-line, intrinsically-sized content) — so two such widgets
//    placed side by side with only a percent or two of gap between
//    their boxes end up visually touching or overlapping at the seam
//    once you're at a narrow enough width, even though each is still
//    individually clipped inside its own box. Every pair of
//    horizontally-adjacent elements below keeps at least a ~5-8%
//    gap, and status-pill labels are kept short ("Available", not
//    "Available for work") so they never need that much room anyway.
function textElement(rect: Rect, content: string, style: Partial<CanvasTextStyle>, zIndex: number): CanvasElementData {
  return {
    id: templateId(),
    type: "text",
    content,
    ...rect,
    rotationDeg: 0,
    zIndex,
    textStyle: { ...defaultTextStyle(), ...style },
    imageStyle: defaultImageStyle(),
    animations: [],
  };
}

function widgetElement(rect: Rect, payload: WidgetPayload, style: Partial<CanvasTextStyle>, zIndex: number): CanvasElementData {
  return {
    id: templateId(),
    type: "widget",
    content: encodeWidget(payload),
    ...rect,
    rotationDeg: 0,
    zIndex,
    textStyle: { ...defaultTextStyle(), ...style },
    imageStyle: defaultImageStyle(),
    animations: [],
  };
}

const MUTED = "rgba(244, 244, 248, 0.7)";

export interface CanvasTemplate {
  name: string;
  description: string;
  // Applied alongside the elements so the canvas is tall enough to
  // show the whole layout without the member having to know to go
  // adjust the height slider themselves first.
  recommendedCanvasHeightPx: number;
  build: () => CanvasElementData[];
}

export const canvasTemplates: Record<string, CanvasTemplate> = {
  intro: {
    name: "Simple Intro",
    description: "Name, tagline, and a couple of quick stats — the lightest way to start.",
    recommendedCanvasHeightPx: 460,
    build: () => [
      textElement({ xPct: 6, yPx: 30, widthPct: 46, heightPx: 100 }, "Your Name", { fontSizePx: 32, fontWeight: 800 }, 0),
      widgetElement(
        { xPct: 56, yPx: 30, widthPct: 38, heightPx: 64 },
        { __widget: true, kind: "status", data: { label: "Available", state: "available" } },
        { fontSizePx: 13 },
        1,
      ),
      textElement(
        { xPct: 6, yPx: 140, widthPct: 58, heightPx: 80 },
        "A short line about what you do.",
        { fontSizePx: 17, fontWeight: 500, color: MUTED },
        2,
      ),
      widgetElement(
        { xPct: 6, yPx: 240, widthPct: 26, heightPx: 110 },
        { __widget: true, kind: "stat", data: { label: "Years experience", value: 5, suffix: "+" } },
        { fontSizePx: 16 },
        3,
      ),
      widgetElement(
        { xPct: 38, yPx: 240, widthPct: 26, heightPx: 110 },
        { __widget: true, kind: "stat", data: { label: "Projects shipped", value: 40, suffix: "+" } },
        { fontSizePx: 16 },
        4,
      ),
    ],
  },

  skills: {
    name: "Skills Spotlight",
    description: "Lead with what you're good at — a skill breakdown plus availability.",
    recommendedCanvasHeightPx: 600,
    build: () => [
      textElement({ xPct: 6, yPx: 28, widthPct: 44, heightPx: 140 }, "What I work with", { fontSizePx: 26, fontWeight: 700 }, 0),
      widgetElement(
        { xPct: 54, yPx: 28, widthPct: 40, heightPx: 64 },
        { __widget: true, kind: "status", data: { label: "Open to work", state: "available" } },
        { fontSizePx: 13 },
        1,
      ),
      widgetElement(
        { xPct: 6, yPx: 180, widthPct: 52, heightPx: 330 },
        {
          __widget: true,
          kind: "skillbars",
          data: {
            skills: [
              { label: "Design", pct: 90 },
              { label: "Front-end", pct: 80 },
              { label: "Product strategy", pct: 70 },
              { label: "Motion", pct: 60 },
            ],
          },
        },
        { fontSizePx: 16 },
        2,
      ),
      widgetElement(
        { xPct: 64, yPx: 180, widthPct: 30, heightPx: 110 },
        { __widget: true, kind: "stat", data: { label: "Years experience", value: 6, suffix: "+" } },
        { fontSizePx: 16 },
        3,
      ),
    ],
  },

  availability: {
    name: "Availability Ticker",
    description: "A scrolling banner up top for open-to-work status, with the essentials below.",
    recommendedCanvasHeightPx: 460,
    build: () => [
      widgetElement(
        { xPct: 0, yPx: 20, widthPct: 100, heightPx: 60 },
        {
          __widget: true,
          kind: "marquee",
          data: { text: "OPEN FOR FREELANCE WORK · AVAILABLE FROM NEXT MONTH · LET'S BUILD SOMETHING ·", speed: "medium" },
        },
        { fontSizePx: 22 },
        0,
      ),
      textElement({ xPct: 6, yPx: 100, widthPct: 44, heightPx: 90 }, "Currently available", { fontSizePx: 20, fontWeight: 700 }, 1),
      widgetElement(
        { xPct: 58, yPx: 100, widthPct: 34, heightPx: 100 },
        { __widget: true, kind: "stat", data: { label: "Response time", value: 24, suffix: "h" } },
        { fontSizePx: 16 },
        2,
      ),
      textElement(
        { xPct: 6, yPx: 204, widthPct: 44, heightPx: 160 },
        "Taking on new freelance and contract work starting next month.",
        { fontSizePx: 15, fontWeight: 400, color: MUTED },
        3,
      ),
      widgetElement(
        { xPct: 58, yPx: 210, widthPct: 34, heightPx: 64 },
        { __widget: true, kind: "status", data: { label: "Status", state: "available" } },
        { fontSizePx: 13 },
        4,
      ),
    ],
  },

  overview: {
    name: "Full Overview",
    description: "One of everything — a fuller layout to trim down rather than build up from scratch.",
    recommendedCanvasHeightPx: 760,
    build: () => [
      textElement({ xPct: 6, yPx: 28, widthPct: 40, heightPx: 100 }, "Your Name", { fontSizePx: 28, fontWeight: 800 }, 0),
      widgetElement(
        { xPct: 54, yPx: 28, widthPct: 38, heightPx: 64 },
        { __widget: true, kind: "status", data: { label: "Available", state: "available" } },
        { fontSizePx: 13 },
        1,
      ),
      textElement(
        { xPct: 6, yPx: 140, widthPct: 46, heightPx: 150 },
        "A short line about what you do and who you help.",
        { fontSizePx: 15, fontWeight: 400, color: MUTED },
        2,
      ),
      widgetElement(
        { xPct: 6, yPx: 310, widthPct: 44, heightPx: 270 },
        {
          __widget: true,
          kind: "skillbars",
          data: {
            skills: [
              { label: "Design", pct: 88 },
              { label: "Front-end", pct: 78 },
              { label: "Strategy", pct: 66 },
              { label: "Motion", pct: 55 },
            ],
          },
        },
        { fontSizePx: 15 },
        3,
      ),
      widgetElement(
        { xPct: 55, yPx: 310, widthPct: 18, heightPx: 110 },
        { __widget: true, kind: "stat", data: { label: "Years exp", value: 5, suffix: "+" } },
        { fontSizePx: 14 },
        4,
      ),
      widgetElement(
        { xPct: 78, yPx: 310, widthPct: 18, heightPx: 110 },
        { __widget: true, kind: "stat", data: { label: "Projects", value: 35, suffix: "+" } },
        { fontSizePx: 14 },
        5,
      ),
      widgetElement(
        { xPct: 0, yPx: 600, widthPct: 100, heightPx: 60 },
        { __widget: true, kind: "marquee", data: { text: "OPEN TO NEW WORK · SELECTED PROJECTS BELOW · LET'S TALK ·", speed: "medium" } },
        { fontSizePx: 20 },
        6,
      ),
    ],
  },
};
