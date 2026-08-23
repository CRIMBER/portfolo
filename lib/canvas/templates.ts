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
    recommendedCanvasHeightPx: 420,
    build: () => [
      textElement({ xPct: 6, yPx: 36, widthPct: 60, heightPx: 64 }, "Your Name", { fontSizePx: 42, fontWeight: 800 }, 0),
      textElement(
        { xPct: 6, yPx: 112, widthPct: 55, heightPx: 50 },
        "A short line about what you do.",
        { fontSizePx: 19, fontWeight: 500, color: MUTED },
        1,
      ),
      widgetElement(
        { xPct: 70, yPx: 36, widthPct: 24, heightPx: 56 },
        { __widget: true, kind: "status", data: { label: "Available for work", state: "available" } },
        { fontSizePx: 15 },
        2,
      ),
      widgetElement(
        { xPct: 6, yPx: 200, widthPct: 26, heightPx: 110 },
        { __widget: true, kind: "stat", data: { label: "Years experience", value: 5, suffix: "+" } },
        { fontSizePx: 16 },
        3,
      ),
      widgetElement(
        { xPct: 36, yPx: 200, widthPct: 26, heightPx: 110 },
        { __widget: true, kind: "stat", data: { label: "Projects shipped", value: 40, suffix: "+" } },
        { fontSizePx: 16 },
        4,
      ),
    ],
  },

  skills: {
    name: "Skills Spotlight",
    description: "Lead with what you're good at — a skill breakdown plus availability.",
    recommendedCanvasHeightPx: 500,
    build: () => [
      textElement({ xPct: 6, yPx: 32, widthPct: 52, heightPx: 56 }, "What I work with", { fontSizePx: 34, fontWeight: 700 }, 0),
      widgetElement(
        { xPct: 6, yPx: 104, widthPct: 56, heightPx: 330 },
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
        1,
      ),
      widgetElement(
        { xPct: 68, yPx: 32, widthPct: 26, heightPx: 56 },
        { __widget: true, kind: "status", data: { label: "Open to collab", state: "available" } },
        { fontSizePx: 15 },
        2,
      ),
      widgetElement(
        { xPct: 68, yPx: 112, widthPct: 26, heightPx: 110 },
        { __widget: true, kind: "stat", data: { label: "Years experience", value: 6, suffix: "+" } },
        { fontSizePx: 16 },
        3,
      ),
    ],
  },

  availability: {
    name: "Availability Ticker",
    description: "A scrolling banner up top for open-to-work status, with the essentials below.",
    recommendedCanvasHeightPx: 360,
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
      textElement({ xPct: 6, yPx: 110, widthPct: 55, heightPx: 52 }, "Currently available", { fontSizePx: 30, fontWeight: 700 }, 1),
      textElement(
        { xPct: 6, yPx: 172, widthPct: 50, heightPx: 60 },
        "Taking on new freelance and contract work starting next month.",
        { fontSizePx: 17, fontWeight: 400, color: MUTED },
        2,
      ),
      widgetElement(
        { xPct: 64, yPx: 110, widthPct: 30, heightPx: 100 },
        { __widget: true, kind: "stat", data: { label: "Response time", value: 24, suffix: "h" } },
        { fontSizePx: 16 },
        3,
      ),
      widgetElement(
        { xPct: 64, yPx: 222, widthPct: 30, heightPx: 56 },
        { __widget: true, kind: "status", data: { label: "Status", state: "available" } },
        { fontSizePx: 15 },
        4,
      ),
    ],
  },

  overview: {
    name: "Full Overview",
    description: "One of everything — a fuller layout to trim down rather than build up from scratch.",
    recommendedCanvasHeightPx: 620,
    build: () => [
      textElement({ xPct: 6, yPx: 32, widthPct: 50, heightPx: 60 }, "Your Name", { fontSizePx: 38, fontWeight: 800 }, 0),
      widgetElement(
        { xPct: 70, yPx: 32, widthPct: 24, heightPx: 56 },
        { __widget: true, kind: "status", data: { label: "Available for work", state: "available" } },
        { fontSizePx: 15 },
        1,
      ),
      textElement(
        { xPct: 6, yPx: 104, widthPct: 55, heightPx: 50 },
        "A short line about what you do and who you help.",
        { fontSizePx: 18, fontWeight: 400, color: MUTED },
        2,
      ),
      widgetElement(
        { xPct: 6, yPx: 176, widthPct: 46, heightPx: 270 },
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
        { xPct: 56, yPx: 176, widthPct: 19, heightPx: 110 },
        { __widget: true, kind: "stat", data: { label: "Years exp", value: 5, suffix: "+" } },
        { fontSizePx: 15 },
        4,
      ),
      widgetElement(
        { xPct: 77, yPx: 176, widthPct: 19, heightPx: 110 },
        { __widget: true, kind: "stat", data: { label: "Projects", value: 35, suffix: "+" } },
        { fontSizePx: 15 },
        5,
      ),
      widgetElement(
        { xPct: 0, yPx: 470, widthPct: 100, heightPx: 60 },
        { __widget: true, kind: "marquee", data: { text: "OPEN TO NEW WORK · SELECTED PROJECTS BELOW · LET'S TALK ·", speed: "medium" } },
        { fontSizePx: 20 },
        6,
      ),
    ],
  },
};
