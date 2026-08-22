"use client";

import { useEffect, useRef } from "react";
import styles from "@/app/home.module.css";

// A pixel-grid face that lives assembled most of the time, breathes
// outward into a scattered burst and back on a slow cycle, and reacts
// to the cursor with a local repel — same canvas/ResizeObserver/RAF
// shape as components/portfolio/Particles.tsx, just a bespoke variant
// for the homepage rather than a member-selectable preset.
export function PixelFace({ color }: { color: string }) {
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

    // Fixed-resolution mask (in grid cells, not pixels) so the same
    // face shape scales cleanly to any viewport — only cellSize below
    // changes with container size, not the number of cells.
    const GRID = 50;
    let cellSize = 8;

    interface Particle {
      tx: number;
      ty: number; // target: this cell's position when assembled into the face
      sx: number;
      sy: number; // scatter: where it flies to when the face bursts apart
      x: number;
      y: number; // current eased position
      phase: number; // per-particle twinkle offset
    }
    let particles: Particle[] = [];

    // Draws a simple face into an offscreen canvas at GRID resolution,
    // punches the eyes/mouth out as negative space, then samples alpha
    // to know which grid cells belong to the silhouette.
    function buildMask(): boolean[] {
      const off = document.createElement("canvas");
      off.width = GRID;
      off.height = GRID;
      const octx = off.getContext("2d");
      if (!octx) return new Array(GRID * GRID).fill(false);

      const cx = GRID / 2;
      const cy = GRID / 2;
      const headR = GRID * 0.42;

      octx.fillStyle = "#fff";
      octx.beginPath();
      octx.arc(cx, cy, headR, 0, Math.PI * 2);
      octx.fill();

      octx.globalCompositeOperation = "destination-out";
      const eyeR = headR * 0.1;
      const eyeOffsetX = headR * 0.34;
      const eyeOffsetY = headR * 0.1;
      octx.beginPath();
      octx.arc(cx - eyeOffsetX, cy - eyeOffsetY, eyeR, 0, Math.PI * 2);
      octx.fill();
      octx.beginPath();
      octx.arc(cx + eyeOffsetX, cy - eyeOffsetY, eyeR, 0, Math.PI * 2);
      octx.fill();

      octx.lineWidth = headR * 0.1;
      octx.lineCap = "round";
      octx.beginPath();
      octx.arc(cx, cy + headR * 0.08, headR * 0.42, Math.PI * 0.18, Math.PI * 0.82);
      octx.stroke();

      const data = octx.getImageData(0, 0, GRID, GRID).data;
      const mask = new Array(GRID * GRID);
      for (let i = 0; i < GRID * GRID; i++) mask[i] = data[i * 4 + 3] > 40;
      return mask;
    }

    const cursor = { x: -9999, y: -9999 };
    function handlePointerMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      cursor.x = e.clientX - rect.left;
      cursor.y = e.clientY - rect.top;
    }
    window.addEventListener("pointermove", handlePointerMove);

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = canvas.width = rect.width;
      height = canvas.height = rect.height;

      // Scales the whole face down on narrow viewports without
      // changing the grid resolution — same shape, smaller cells.
      const scale = Math.min(1, Math.max(0.42, width / 1400));
      cellSize = 8 * scale;

      const faceSize = GRID * cellSize;
      const originX = width - faceSize - Math.max(90, width * 0.08);
      const originY = height * 0.14;
      const centerX = originX + faceSize / 2;
      const centerY = originY + faceSize / 2;
      // Kept tight enough that even at peak dispersion most particles
      // stay within the canvas — too large and the burst scatters
      // past the edges and momentarily reads as just empty space.
      const burstRadius = faceSize * 0.4;

      const mask = buildMask();
      particles = [];
      for (let row = 0; row < GRID; row++) {
        for (let col = 0; col < GRID; col++) {
          if (!mask[row * GRID + col]) continue;
          const tx = originX + col * cellSize;
          const ty = originY + row * cellSize;
          const dx = tx - centerX;
          const dy = ty - centerY;
          const dist = Math.hypot(dx, dy) || 1;
          const nx = dx / dist;
          const ny = dy / dist;
          const burstDist = dist + burstRadius * (0.6 + Math.random() * 0.8);
          particles.push({
            tx,
            ty,
            sx: centerX + nx * burstDist + (Math.random() - 0.5) * 40,
            sy: centerY + ny * burstDist + (Math.random() - 0.5) * 40,
            x: tx,
            y: ty,
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const draw = (now: number) => {
      ctx.clearRect(0, 0, width, height);

      const cyclePeriod = 9;
      const t = (now / 1000) % cyclePeriod;
      const raw = (1 - Math.cos((t / cyclePeriod) * Math.PI * 2)) / 2;
      const dispersion = reduceMotion ? 0 : Math.pow(raw, 1.6);

      const repelRadius = 90;
      const repelStrength = 60;

      ctx.fillStyle = color;
      for (const p of particles) {
        const bx = lerp(p.tx, p.sx, dispersion);
        const by = lerp(p.ty, p.sy, dispersion);

        let ox = bx;
        let oy = by;
        const dx = bx - cursor.x;
        const dy = by - cursor.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0.001 && dist < repelRadius) {
          const force = (1 - dist / repelRadius) * repelStrength;
          ox += (dx / dist) * force;
          oy += (dy / dist) * force;
        }

        if (!reduceMotion) {
          p.x += (ox - p.x) * 0.09;
          p.y += (oy - p.y) * 0.09;
        } else {
          p.x = ox;
          p.y = oy;
        }

        const twinkle = reduceMotion ? 1 : 0.75 + Math.sin(now * 0.002 + p.phase) * 0.25;
        ctx.globalAlpha = (1 - dispersion * 0.35) * twinkle;
        const size = Math.max(1.5, cellSize - 2) * (1 - dispersion * 0.3);
        ctx.fillRect(p.x, p.y, size, size);
      }
      ctx.globalAlpha = 1;

      if (!reduceMotion) frame = requestAnimationFrame(draw);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();
    draw(0);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      cancelAnimationFrame(frame);
    };
  }, [color]);

  return <canvas ref={canvasRef} className={styles.pixelFaceCanvas} aria-hidden="true" />;
}
