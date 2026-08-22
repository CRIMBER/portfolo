"use client";

import { useEffect, useRef } from "react";
import styles from "./renderer.module.css";

export type ParticlesVariant =
  | "floating-dots"
  | "constellation"
  | "snowfall"
  | "embers"
  | "fireflies"
  | "pixels"
  | "lightning"
  | "smoke"
  | "fog"
  | "matrix-rain";

interface Dot {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  phase: number;
}

function makeDots(width: number, height: number, count: number, scale: number, variant: ParticlesVariant): Dot[] {
  return Array.from({ length: count }, () => {
    const base: Dot = {
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.6 + 0.6,
      vx: (Math.random() - 0.5) * 0.15 * scale,
      vy: (Math.random() - 0.5) * 0.15 * scale,
      phase: Math.random() * Math.PI * 2,
    };
    if (variant === "snowfall") {
      base.r = Math.random() * 2 + 1;
      base.vx = (Math.random() - 0.5) * 0.2 * scale;
      base.vy = (Math.random() * 0.35 + 0.15) * scale;
    } else if (variant === "embers") {
      base.r = Math.random() * 1.4 + 0.5;
      base.vx = (Math.random() - 0.5) * 0.1 * scale;
      base.vy = -(Math.random() * 0.4 + 0.15) * scale;
    } else if (variant === "fireflies") {
      base.r = Math.random() * 1.8 + 1;
      base.vx = (Math.random() - 0.5) * 0.08 * scale;
      base.vy = (Math.random() - 0.5) * 0.08 * scale;
    }
    return base;
  });
}

interface PixelCell {
  opacity: number;
}

interface Bolt {
  points: { x: number; y: number }[];
  life: number;
}

function makeBolt(width: number, height: number): Bolt {
  const startX = Math.random() * width;
  const endY = height * (0.45 + Math.random() * 0.5);
  const segments = 9;
  const stepY = endY / segments;
  const spread = Math.max(18, width * 0.05);
  const points: { x: number; y: number }[] = [{ x: startX, y: 0 }];
  let x = startX;
  for (let i = 1; i <= segments; i++) {
    x += (Math.random() - 0.5) * spread;
    points.push({ x, y: i * stepY });
  }
  return { points, life: 1 };
}

interface Puff {
  x: number;
  y: number;
  r: number;
  alpha: number;
  vx: number;
  vy: number;
  growth: number;
  decay: number;
}

interface FogBlob {
  x: number;
  y: number;
  rx: number;
  ry: number;
  alpha: number;
  vx: number;
}

interface RainColumn {
  x: number;
  y: number;
  speed: number;
  chars: string[];
}

const MATRIX_CHARS = "01アイウエオカキクケコサシスセソタチツテト";

// Implements particles/* — real canvas animations, not decorative
// stubs. Dot count/speed/frequency scale with intensity. Only mounted
// when a particles preset is actually configured — see
// PortfolioRenderer.
export function Particles({ scale, color, variant }: { scale: number; color: string; variant: ParticlesVariant }) {
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
    let tick = 0;

    let dots: Dot[] = [];
    let cells: PixelCell[] = [];
    let cols = 0;
    let rows = 0;
    const cellSize = 16;
    let bolts: Bolt[] = [];
    let nextBoltAt = 0;
    let puffs: Puff[] = [];
    let blobs: FogBlob[] = [];
    let columns: RainColumn[] = [];

    const makeRainColumn = (i: number): RainColumn => ({
      x: i * cellSize,
      y: Math.random() * -height,
      speed: (Math.random() * 1.2 + 0.8) * scale,
      chars: Array.from(
        { length: Math.round(6 + Math.random() * 10) },
        () => MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)],
      ),
    });

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = canvas.width = rect.width;
      height = canvas.height = rect.height;

      if (variant === "pixels") {
        cols = Math.ceil(width / cellSize);
        rows = Math.ceil(height / cellSize);
        cells = Array.from({ length: cols * rows }, () => ({ opacity: 0 }));
      } else if (variant === "matrix-rain") {
        cols = Math.ceil(width / cellSize);
        columns = Array.from({ length: cols }, (_, i) => makeRainColumn(i));
      } else if (variant === "fog") {
        const count = Math.round(Math.min(10, Math.max(3, width / 160)) * Math.min(scale, 1.5));
        blobs = Array.from({ length: count }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          rx: width * (0.18 + Math.random() * 0.12),
          ry: height * (0.12 + Math.random() * 0.08),
          alpha: 0.06 + Math.random() * 0.06,
          vx: (Math.random() - 0.5) * 0.12 * scale,
        }));
      } else if (variant === "lightning") {
        bolts = [];
        nextBoltAt = tick + 20;
      } else if (variant === "smoke") {
        puffs = [];
      } else {
        const density = variant === "constellation" ? 12000 : 18000;
        const count = Math.round(Math.min(90, Math.max(20, (width * height) / density)) * Math.min(scale, 1.5));
        dots = makeDots(width, height, count, scale, variant);
      }
    };

    const respawn = (dot: Dot) => {
      if (variant === "snowfall") {
        dot.y = -4;
        dot.x = Math.random() * width;
      } else if (variant === "embers") {
        dot.y = height + 4;
        dot.x = Math.random() * width;
      }
    };

    const spawnPuff = (): Puff => ({
      x: Math.random() * width,
      y: height + 8,
      r: 8 + Math.random() * 10,
      alpha: 0.1 + Math.random() * 0.1,
      vx: (Math.random() - 0.5) * 0.06 * scale,
      vy: -(0.15 + Math.random() * 0.2) * scale,
      growth: 0.12 + Math.random() * 0.1,
      decay: 0.0018 + Math.random() * 0.0015,
    });

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      tick += 1;

      if (variant === "constellation") {
        for (const dot of dots) {
          if (!reduceMotion) {
            dot.x += dot.vx;
            dot.y += dot.vy;
            if (dot.x < 0 || dot.x > width) dot.vx *= -1;
            if (dot.y < 0 || dot.y > height) dot.vy *= -1;
          }
        }
        const linkDist = Math.min(140, Math.max(70, width / 8));
        ctx.strokeStyle = color;
        for (let i = 0; i < dots.length; i++) {
          for (let j = i + 1; j < dots.length; j++) {
            const dx = dots[i].x - dots[j].x;
            const dy = dots[i].y - dots[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < linkDist) {
              ctx.globalAlpha = (1 - dist / linkDist) * 0.35;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(dots[i].x, dots[i].y);
              ctx.lineTo(dots[j].x, dots[j].y);
              ctx.stroke();
            }
          }
        }
        ctx.fillStyle = color;
        for (const dot of dots) {
          ctx.globalAlpha = 0.7;
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (variant === "fireflies") {
        ctx.fillStyle = color;
        for (const dot of dots) {
          if (!reduceMotion) {
            dot.x += dot.vx;
            dot.y += dot.vy;
            if (dot.x < 0 || dot.x > width) dot.vx *= -1;
            if (dot.y < 0 || dot.y > height) dot.vy *= -1;
          }
          const glow = reduceMotion ? 0.6 : 0.35 + Math.abs(Math.sin(tick * 0.02 + dot.phase)) * 0.65;
          ctx.globalAlpha = glow;
          ctx.shadowColor = color;
          ctx.shadowBlur = 8 * glow;
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      } else if (variant === "pixels") {
        if (!reduceMotion) {
          const flips = Math.max(1, Math.round(cols * rows * 0.0015 * scale));
          for (let i = 0; i < flips; i++) {
            const idx = Math.floor(Math.random() * cells.length);
            cells[idx].opacity = 0.45 + Math.random() * 0.55;
          }
        }
        ctx.fillStyle = color;
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const cell = cells[row * cols + col];
            if (cell.opacity > 0.02) {
              ctx.globalAlpha = cell.opacity;
              ctx.fillRect(col * cellSize, row * cellSize, cellSize - 2, cellSize - 2);
              if (!reduceMotion) cell.opacity *= 0.9;
            }
          }
        }
      } else if (variant === "lightning") {
        if (!reduceMotion && tick >= nextBoltAt) {
          bolts.push(makeBolt(width, height));
          if (Math.random() < 0.35) bolts.push(makeBolt(width, height));
          nextBoltAt = tick + Math.max(35, 200 / scale) + Math.random() * 80;
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.lineJoin = "round";
        for (const bolt of bolts) {
          ctx.globalAlpha = Math.max(0, bolt.life);
          ctx.shadowColor = color;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(bolt.points[0].x, bolt.points[0].y);
          for (const point of bolt.points.slice(1)) ctx.lineTo(point.x, point.y);
          ctx.stroke();
          if (!reduceMotion) bolt.life -= 0.07;
        }
        ctx.shadowBlur = 0;
        bolts = bolts.filter((bolt) => bolt.life > 0);
      } else if (variant === "smoke") {
        if (!reduceMotion && tick % Math.max(4, Math.round(24 / scale)) === 0 && puffs.length < 40) {
          puffs.push(spawnPuff());
        }
        for (const puff of puffs) {
          const gradient = ctx.createRadialGradient(puff.x, puff.y, 0, puff.x, puff.y, puff.r);
          gradient.addColorStop(0, color);
          gradient.addColorStop(1, "transparent");
          ctx.globalAlpha = Math.max(0, puff.alpha);
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(puff.x, puff.y, puff.r, 0, Math.PI * 2);
          ctx.fill();
          if (!reduceMotion) {
            puff.x += puff.vx;
            puff.y += puff.vy;
            puff.r += puff.growth;
            puff.alpha -= puff.decay;
          }
        }
        puffs = puffs.filter((puff) => puff.alpha > 0.01 && puff.y + puff.r > -20);
      } else if (variant === "fog") {
        for (const blob of blobs) {
          const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.rx);
          gradient.addColorStop(0, color);
          gradient.addColorStop(1, "transparent");
          ctx.globalAlpha = blob.alpha;
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.ellipse(blob.x, blob.y, blob.rx, blob.ry, 0, 0, Math.PI * 2);
          ctx.fill();
          if (!reduceMotion) {
            blob.x += blob.vx;
            if (blob.x - blob.rx > width) blob.x = -blob.rx;
            if (blob.x + blob.rx < 0) blob.x = width + blob.rx;
          }
        }
      } else if (variant === "matrix-rain") {
        ctx.font = `${cellSize - 2}px monospace`;
        ctx.textBaseline = "top";
        ctx.fillStyle = color;
        for (const column of columns) {
          for (let i = 0; i < column.chars.length; i++) {
            const charY = column.y - i * cellSize;
            if (charY < -cellSize || charY > height) continue;
            ctx.globalAlpha = Math.max(0, 1 - i / column.chars.length);
            ctx.fillText(column.chars[i], column.x, charY);
          }
          if (!reduceMotion) {
            column.y += column.speed * cellSize * 0.06;
            if (column.y - column.chars.length * cellSize > height) {
              const fresh = makeRainColumn(column.x / cellSize);
              fresh.y = Math.random() * -200;
              Object.assign(column, fresh);
            }
          }
        }
      } else {
        // floating-dots, snowfall, embers all share the same
        // drift-and-wrap/respawn motion, just with different vectors
        // set at spawn time in makeDots.
        ctx.fillStyle = color;
        for (const dot of dots) {
          if (!reduceMotion) {
            dot.x += dot.vx;
            dot.y += dot.vy;
            if (variant === "floating-dots") {
              if (dot.x < 0 || dot.x > width) dot.vx *= -1;
              if (dot.y < 0 || dot.y > height) dot.vy *= -1;
            } else {
              if (dot.x < 0 || dot.x > width) dot.vx *= -1;
              if (dot.y < -8 || dot.y > height + 8) respawn(dot);
            }
          }
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (!reduceMotion) frame = requestAnimationFrame(draw);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();
    draw();

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [scale, color, variant]);

  return <canvas ref={canvasRef} className={styles.particlesCanvas} aria-hidden="true" />;
}
