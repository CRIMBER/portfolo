import QRCode from "qrcode";

// The QR always encodes Portfolio.stableSlug via /p/[stableSlug] (see
// prisma/schema.prisma) — never the username — so a printed code
// keeps working even if the member renames their handle later.
export function stableSlugUrl(stableSlug: string): string {
  const origin = process.env.SITE_URL ?? "http://localhost:3000";
  return `${origin}/p/${stableSlug}`;
}

// No fixed width option here on purpose — passing one bakes that
// literal pixel size into the SVG's width/height attributes, which
// overrides the viewBox-based scaling and makes it render at that
// exact size regardless of its container (the bug: a 240px-square SVG
// stuffed into a 160px box just overflows everything below it).
// Without a width option the library omits width/height entirely,
// which browsers don't reliably size to 100% on their own — so this
// injects explicit width="100%" height="100%" itself, leaving the
// viewBox to define the actual QR proportions.
export async function generateQrSvg(url: string): Promise<string> {
  const raw = await QRCode.toString(url, { type: "svg", margin: 1 });
  return raw.replace("<svg ", '<svg width="100%" height="100%" ');
}

export function generateQrPngDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, { margin: 1, width: 1024 });
}
