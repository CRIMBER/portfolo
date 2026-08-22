// Small color utilities shared by the renderer (to detect translucent
// surfaces for glassmorphism) and the dashboard's color-picker form
// (native <input type="color"> only understands opaque #rrggbb, so a
// stored rgba()/8-digit-hex color has to be split into hex + alpha to
// populate the form, then recombined on save).

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("")}`;
}

export function parseColor(input: string): { hex: string; alpha: number } {
  const rgba = input.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/i);
  if (rgba) {
    const [, r, g, b, a] = rgba;
    return { hex: rgbToHex(Number(r), Number(g), Number(b)), alpha: a !== undefined ? parseFloat(a) : 1 };
  }

  const hex8 = input.match(/^#([0-9a-f]{8})$/i);
  if (hex8) {
    const h = hex8[1];
    return { hex: `#${h.slice(0, 6)}`, alpha: parseInt(h.slice(6, 8), 16) / 255 };
  }

  const hex6 = input.match(/^#([0-9a-f]{6})$/i);
  if (hex6) return { hex: input.toLowerCase(), alpha: 1 };

  return { hex: "#ffffff", alpha: 1 };
}

export function toRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) || 0;
  const g = parseInt(clean.slice(2, 4), 16) || 0;
  const b = parseInt(clean.slice(4, 6), 16) || 0;
  const clampedAlpha = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${Math.round(clampedAlpha * 100) / 100})`;
}
