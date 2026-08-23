"use client";

import { useEffect, useRef } from "react";
import styles from "@/app/home.module.css";

// A generative pixel-grid animation for the homepage background.
// Two independent silhouettes assemble, idle, and hold — each its
// own color — then periodically both scatter into a haze that
// drifts across the *entire* page, slowly shifts color, then settles
// into a single shared shape (Earth or a cobweb); hold, then scatter
// again and re-form as two new independent silhouettes. Same
// canvas/ResizeObserver/RAF shape as components/portfolio/Particles.tsx,
// just a bespoke homepage variant.
//
// Deliberately generic silhouettes (cape figure, domino mask,
// lightning bolt, shield rim), not any specific studio's copyrighted
// character or logo — this ships on a public page.
type SoloShape = "face" | "cape" | "mask" | "bolt" | "shield";
type UnityShape = "earth" | "cobweb";

const SOLO_SHAPES: SoloShape[] = ["face", "cape", "mask", "bolt", "shield"];
const SOLO_COLORS = ["#8b85ff", "#ff5d73", "#ffd166", "#4dd9c0", "#6ea8ff", "#ff9f5a"];
const EARTH_OCEAN = "#3d7dd6";
const EARTH_LAND = "#5fbf6f";
const COBWEB_COLOR = "#d8d6ff";

const GRID = 48;

function pick<T>(arr: T[], excluding?: T): T {
  const pool = excluding === undefined ? arr : arr.filter((v) => v !== excluding);
  return pool[Math.floor(Math.random() * pool.length)];
}

function easeInOut(p: number) {
  const c = Math.min(1, Math.max(0, p));
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lerpColor(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

// ---- shape silhouettes, drawn into a GRID x GRID offscreen canvas
// and sampled by alpha to know which cells belong to the shape ----

function drawFace(ctx: CanvasRenderingContext2D, g: number) {
  const cx = g / 2;
  const cy = g / 2;
  const r = g * 0.42;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "destination-out";
  const eyeR = r * 0.1;
  ctx.beginPath();
  ctx.arc(cx - r * 0.34, cy - r * 0.1, eyeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + r * 0.34, cy - r * 0.1, eyeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = r * 0.1;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.08, r * 0.42, Math.PI * 0.18, Math.PI * 0.82);
  ctx.stroke();
  ctx.globalCompositeOperation = "source-over";
}

// A generic caped figure, arms akimbo — evokes "hero" without
// reproducing any specific character's design.
function drawCape(ctx: CanvasRenderingContext2D, g: number) {
  const cx = g * 0.44;
  ctx.beginPath();
  ctx.arc(cx, g * 0.15, g * 0.075, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - g * 0.11, g * 0.23);
  ctx.lineTo(cx + g * 0.11, g * 0.23);
  ctx.lineTo(cx + g * 0.08, g * 0.52);
  ctx.lineTo(cx - g * 0.08, g * 0.52);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - g * 0.08, g * 0.52);
  ctx.lineTo(cx - g * 0.015, g * 0.52);
  ctx.lineTo(cx - g * 0.035, g * 0.87);
  ctx.lineTo(cx - g * 0.11, g * 0.87);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + g * 0.015, g * 0.52);
  ctx.lineTo(cx + g * 0.08, g * 0.52);
  ctx.lineTo(cx + g * 0.13, g * 0.87);
  ctx.lineTo(cx + g * 0.06, g * 0.87);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - g * 0.11, g * 0.25);
  ctx.lineTo(cx - g * 0.22, g * 0.41);
  ctx.lineTo(cx - g * 0.14, g * 0.47);
  ctx.lineTo(cx - g * 0.08, g * 0.33);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + g * 0.11, g * 0.25);
  ctx.lineTo(cx + g * 0.22, g * 0.41);
  ctx.lineTo(cx + g * 0.14, g * 0.47);
  ctx.lineTo(cx + g * 0.08, g * 0.33);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + g * 0.09, g * 0.23);
  ctx.quadraticCurveTo(cx + g * 0.34, g * 0.4, cx + g * 0.28, g * 0.7);
  ctx.quadraticCurveTo(cx + g * 0.22, g * 0.86, cx + g * 0.1, g * 0.76);
  ctx.lineTo(cx + g * 0.09, g * 0.5);
  ctx.closePath();
  ctx.fill();
}

// A domino/masquerade mask — generic "secret identity" motif.
function drawMask(ctx: CanvasRenderingContext2D, g: number) {
  const cy = g * 0.5;
  ctx.beginPath();
  ctx.ellipse(g * 0.36, cy, g * 0.14, g * 0.09, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(g * 0.64, cy, g * 0.14, g * 0.09, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(g * 0.44, cy - g * 0.04);
  ctx.quadraticCurveTo(g * 0.5, cy - g * 0.1, g * 0.56, cy - g * 0.04);
  ctx.lineTo(g * 0.56, cy + g * 0.03);
  ctx.quadraticCurveTo(g * 0.5, cy - g * 0.03, g * 0.44, cy + g * 0.03);
  ctx.closePath();
  ctx.fill();
}

function drawBolt(ctx: CanvasRenderingContext2D, g: number) {
  ctx.beginPath();
  ctx.moveTo(g * 0.55, g * 0.05);
  ctx.lineTo(g * 0.3, g * 0.52);
  ctx.lineTo(g * 0.46, g * 0.52);
  ctx.lineTo(g * 0.38, g * 0.95);
  ctx.lineTo(g * 0.7, g * 0.42);
  ctx.lineTo(g * 0.52, g * 0.42);
  ctx.lineTo(g * 0.62, g * 0.05);
  ctx.closePath();
  ctx.fill();
}

// A blank shield rim — no emblem — reads as "shield," not any crest.
function drawShield(ctx: CanvasRenderingContext2D, g: number) {
  const cx = g * 0.5;
  ctx.beginPath();
  ctx.moveTo(cx - g * 0.28, g * 0.12);
  ctx.quadraticCurveTo(cx, g * 0.02, cx + g * 0.28, g * 0.12);
  ctx.lineTo(cx + g * 0.28, g * 0.42);
  ctx.quadraticCurveTo(cx + g * 0.26, g * 0.72, cx, g * 0.95);
  ctx.quadraticCurveTo(cx - g * 0.26, g * 0.72, cx - g * 0.28, g * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.moveTo(cx - g * 0.21, g * 0.15);
  ctx.quadraticCurveTo(cx, g * 0.07, cx + g * 0.21, g * 0.15);
  ctx.lineTo(cx + g * 0.21, g * 0.4);
  ctx.quadraticCurveTo(cx + g * 0.19, g * 0.65, cx, g * 0.86);
  ctx.quadraticCurveTo(cx - g * 0.19, g * 0.65, cx - g * 0.21, g * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
}

function drawEarth(ctx: CanvasRenderingContext2D, g: number) {
  ctx.beginPath();
  ctx.arc(g / 2, g / 2, g * 0.44, 0, Math.PI * 2);
  ctx.fill();
}

function drawCobweb(ctx: CanvasRenderingContext2D, g: number) {
  const cx = g / 2;
  const cy = g / 2;
  const maxR = g * 0.46;
  const spokes = 9;
  ctx.lineWidth = g * 0.02;
  ctx.strokeStyle = "#fff";
  for (let i = 0; i < spokes; i++) {
    const angle = (i / spokes) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * maxR, cy + Math.sin(angle) * maxR);
    ctx.stroke();
  }
  const rings = 4;
  for (let ring = 1; ring <= rings; ring++) {
    const rr = (ring / rings) * maxR;
    ctx.beginPath();
    for (let i = 0; i <= spokes; i++) {
      const angle = (i / spokes) * Math.PI * 2;
      const wobble = i % 2 === 0 ? 1.06 : 0.96;
      const x = cx + Math.cos(angle) * rr * wobble;
      const y = cy + Math.sin(angle) * rr * wobble;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

const SHAPE_DRAWERS: Record<SoloShape | UnityShape, (ctx: CanvasRenderingContext2D, g: number) => void> = {
  face: drawFace,
  cape: drawCape,
  mask: drawMask,
  bolt: drawBolt,
  shield: drawShield,
  earth: drawEarth,
  cobweb: drawCobweb,
};

interface MaskCell {
  col: number;
  row: number;
  land?: boolean;
}

function buildMask(shape: SoloShape | UnityShape): MaskCell[] {
  const off = document.createElement("canvas");
  off.width = GRID;
  off.height = GRID;
  const ctx = off.getContext("2d");
  if (!ctx) return [];
  ctx.fillStyle = "#fff";
  SHAPE_DRAWERS[shape](ctx, GRID);

  const data = ctx.getImageData(0, 0, GRID, GRID).data;
  const cells: MaskCell[] = [];
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      const i = row * GRID + col;
      if (data[i * 4 + 3] <= 40) continue;
      const land = shape === "earth" ? (Math.sin(col * 0.5) + Math.cos(row * 0.42) + Math.sin((col + row) * 0.28)) > 0.5 : undefined;
      cells.push({ col, row, land });
    }
  }
  return cells;
}

// Every particle's rendered position eases toward a "desired" point
// that blends toX/toY (its settled shape position) with roamX/roamY
// (a point scattered anywhere across the *whole* canvas) according to
// the current stage's dispersion amount — see draw(). toX/toY/
// roamX/roamY/color are all reassigned in place by retarget() at each
// shape swap; the particle's own (x, y) is never reset, which is what
// keeps every transition continuous instead of popping.
interface Particle {
  x: number;
  y: number;
  toX: number;
  toY: number;
  roamX: number;
  roamY: number;
  prevColor: string;
  color: string;
  wanderSeed: number;
  twinklePhase: number;
}

// hold: settled, reads as a shape. disperse: breaks apart and drifts
// out across the page (color unchanged). float: fully scattered,
// wandering freely — this is where the shape identity swaps and the
// color slowly turns from old to new. form: drifts back in and
// resolves into the new shape (color already new).
type Stage = "hold" | "disperse" | "float" | "form";
const STAGE_ORDER: Stage[] = ["hold", "disperse", "float", "form"];
const STAGE_DURATIONS: Record<Stage, number> = { hold: 4.6, disperse: 3.4, float: 4, form: 3.4 };

export function PixelSwarm() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let soloCell = 6.5;
    let unityCell = 10;
    let activeCellSize = soloCell;

    let clusterOrigins: { x: number; y: number }[] = [];
    let unityOrigin = { x: 0, y: 0 };

    let particles: Particle[] = [];
    const initialA = pick(SOLO_SHAPES);
    let activeSolo: { shapes: [SoloShape, SoloShape]; colors: [string, string] } = {
      shapes: [initialA, pick(SOLO_SHAPES, initialA)],
      colors: [pick(SOLO_COLORS), pick(SOLO_COLORS)],
    };
    let activeUnity: UnityShape = "cobweb";
    let phase: "solo" | "unity" = "solo";

    let stageIndex = 0;
    let stage: Stage = STAGE_ORDER[0];
    let stageStart = -1;

    const cursor = { x: -9999, y: -9999 };
    function handlePointerMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      cursor.x = e.clientX - rect.left;
      cursor.y = e.clientY - rect.top;
    }
    window.addEventListener("pointermove", handlePointerMove);

    function layout() {
      const scale = Math.min(1.15, Math.max(0.5, width / 1400));
      soloCell = 6.5 * scale;
      unityCell = 10 * scale;
      const soloSize = GRID * soloCell;
      const unitySize = GRID * unityCell;

      // Clusters spread wide across the page (not tucked into one
      // corner) so the swarm reads across the whole viewport, not
      // just a small patch of it.
      clusterOrigins = [
        { x: width * 0.08, y: height * 0.12 },
        { x: Math.max(width * 0.08, width - soloSize - width * 0.1), y: height * 0.46 },
      ];
      // Centered horizontally but sitting in the upper portion of the
      // page — the hero copy is bottom-anchored, so this keeps the
      // centerpiece shape from sitting squarely on top of it.
      unityOrigin = { x: width / 2 - unitySize / 2, y: Math.max(20, height * 0.32 - unitySize / 2) };
    }

    function shapeTargets(shape: SoloShape | UnityShape, origin: { x: number; y: number }, cell: number, color: string) {
      return buildMask(shape).map((c) => ({
        x: origin.x + c.col * cell,
        y: origin.y + c.row * cell,
        color: shape === "earth" ? (c.land ? EARTH_LAND : EARTH_OCEAN) : color,
      }));
    }

    // Reassigns every particle's shape target, a fresh scatter point
    // spread anywhere across the current canvas, and its color swap.
    // Reuses each particle's *current* on-screen position (not its
    // old target) as the starting point, which is what makes an
    // identity swap invisible: it happens mid-flight, already
    // scattered, never as a pop.
    function retarget(targets: { x: number; y: number; color: string }[], cellSize: number) {
      activeCellSize = cellSize;
      const marginX = Math.max(24, width * 0.02);
      const marginY = Math.max(24, height * 0.02);
      particles = targets.map((t, i) => {
        const prev = particles[i];
        const fromX = prev ? prev.x : t.x;
        const fromY = prev ? prev.y : t.y;
        return {
          x: fromX,
          y: fromY,
          toX: t.x,
          toY: t.y,
          roamX: marginX + Math.random() * Math.max(1, width - marginX * 2),
          roamY: marginY + Math.random() * Math.max(1, height - marginY * 2),
          prevColor: prev ? prev.color : t.color,
          color: t.color,
          wanderSeed: prev ? prev.wanderSeed : Math.random() * 1000,
          twinklePhase: prev ? prev.twinklePhase : Math.random() * Math.PI * 2,
        };
      });
    }

    // pickNew=false just recomputes target coordinates for whichever
    // shapes/colors are already active (e.g. after a resize) without
    // changing what's displayed; pickNew=true rolls a fresh pair.
    function enterSolo(pickNew: boolean) {
      if (pickNew) {
        const shapeA = pick(SOLO_SHAPES, activeSolo.shapes[0]);
        const shapeB = pick(SOLO_SHAPES, shapeA);
        activeSolo = { shapes: [shapeA, shapeB], colors: [pick(SOLO_COLORS), pick(SOLO_COLORS, activeSolo.colors[0])] };
      }
      const [shapeA, shapeB] = activeSolo.shapes;
      const [colorA, colorB] = activeSolo.colors;
      const targets = [
        ...shapeTargets(shapeA, clusterOrigins[0], soloCell, colorA),
        ...shapeTargets(shapeB, clusterOrigins[1], soloCell, colorB),
      ];
      retarget(targets, soloCell);
    }

    function enterUnity(pickNew: boolean) {
      if (pickNew) activeUnity = activeUnity === "earth" ? "cobweb" : "earth";
      const color = activeUnity === "cobweb" ? COBWEB_COLOR : EARTH_OCEAN;
      const targets = shapeTargets(activeUnity, unityOrigin, unityCell, color);
      retarget(targets, unityCell);
    }

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = canvas.width = rect.width;
      height = canvas.height = rect.height;
      layout();
      // Re-seat whichever configuration is active at its new screen
      // position without changing identity or restarting the cycle.
      if (phase === "unity") enterUnity(false);
      else enterSolo(false);
    };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const draw = (now: number) => {
      ctx.clearRect(0, 0, width, height);

      if (reduceMotion) {
        for (const part of particles) {
          ctx.globalAlpha = 0.45;
          ctx.fillStyle = part.color;
          const size = Math.max(1.5, activeCellSize - 1.5);
          ctx.fillRect(part.toX, part.toY, size, size);
        }
        return;
      }

      const t = now / 1000;
      if (stageStart < 0) stageStart = t;
      let elapsed = t - stageStart;
      if (elapsed > STAGE_DURATIONS[stage]) {
        const prevStage = stage;
        stageIndex = (stageIndex + 1) % STAGE_ORDER.length;
        stage = STAGE_ORDER[stageIndex];
        stageStart = t;
        elapsed = 0;
        // The identity swap happens exactly once per half-cycle, right
        // as the swarm finishes dispersing and starts floating — so
        // the new color has the entire float stage to slowly turn
        // before the shape starts forming again.
        if (prevStage === "disperse" && stage === "float") {
          phase = phase === "solo" ? "unity" : "solo";
          if (phase === "unity") enterUnity(true);
          else enterSolo(true);
        }
      }

      const p = elapsed / STAGE_DURATIONS[stage];
      let dispersion: number;
      if (stage === "hold") dispersion = 0;
      else if (stage === "float") dispersion = 1;
      else if (stage === "disperse") dispersion = easeInOut(p);
      else dispersion = 1 - easeInOut(p);

      const repelRadius = 90;
      const repelStrength = 50;
      // Idle jitter while settled, growing into a loose, free-roaming
      // wander the more scattered the swarm is.
      const wanderAmp = 3 + dispersion * 40;

      for (const part of particles) {
        const baseX = lerp(part.toX, part.roamX, dispersion);
        const baseY = lerp(part.toY, part.roamY, dispersion);
        const wx = Math.sin(now * 0.00038 + part.wanderSeed) * wanderAmp;
        const wy = Math.cos(now * 0.00029 + part.wanderSeed * 1.6) * wanderAmp;

        let ox = baseX + wx;
        let oy = baseY + wy;
        const dx = ox - cursor.x;
        const dy = oy - cursor.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0.001 && dist < repelRadius) {
          const force = (1 - dist / repelRadius) * repelStrength;
          ox += (dx / dist) * force;
          oy += (dy / dist) * force;
        }

        part.x += (ox - part.x) * 0.07;
        part.y += (oy - part.y) * 0.07;

        const renderColor = stage === "float" ? lerpColor(part.prevColor, part.color, easeInOut(p)) : part.color;

        const twinkle = 0.75 + Math.sin(now * 0.0018 + part.twinklePhase) * 0.25;
        // Kept deliberately faint — this is atmosphere behind the
        // page's real content, not a foreground effect, and it now
        // spans the full viewport instead of one corner.
        ctx.globalAlpha = lerp(0.42, 0.15, dispersion) * twinkle;
        const size = Math.max(1.5, activeCellSize - 1.5) * (1 - dispersion * 0.2);
        ctx.fillStyle = renderColor;
        ctx.fillRect(part.x, part.y, size, size);
      }
      ctx.globalAlpha = 1;

      frame = requestAnimationFrame(draw);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    width = canvas.width = container.getBoundingClientRect().width;
    height = canvas.height = container.getBoundingClientRect().height;
    layout();
    enterSolo(true);
    for (const part of particles) {
      part.x = part.toX;
      part.y = part.toY;
      part.prevColor = part.color;
    }
    draw(0);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.pixelFaceCanvas} aria-hidden="true" />;
}
