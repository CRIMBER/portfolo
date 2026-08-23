import { ImageResponse } from "next/og";

// Root-level file-convention route (see Next's Metadata Files docs) —
// this is the fallback OG/Twitter card for every route that doesn't
// define its own more specific opengraph-image (i.e. everything
// except /u/[username], which has its own per-portfolio card). No
// request data involved, so this is generated once at build time and
// cached, same as any other static asset.
export const alt = "Portfolio Platform — Not everyone gets in.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#0a0a0c";
const TEXT = "#f4f4f2";
const ACCENT = "#b3aaff";
const DOT_COLORS = ["#8b85ff", "#ff5d73", "#ffd166", "#4dd9c0", "#6ea8ff", "#ff9f5a"];

// A small deterministic scatter echoing the homepage's pixel-swarm
// animation — same palette, just a frozen single frame here since an
// OG card can't move.
function scatterDots(count: number, seed: number) {
  let s = seed;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  return Array.from({ length: count }, () => ({
    x: 640 + rand() * 500,
    y: 30 + rand() * 260,
    size: 5 + rand() * 9,
    color: DOT_COLORS[Math.floor(rand() * DOT_COLORS.length)],
    opacity: 0.3 + rand() * 0.45,
  }));
}

// Google serves woff2 to modern browsers, but Satori/resvg only read
// ttf/otf/woff. An old-Android User-Agent gets it to respond with a
// single unsplit .ttf file (no unicode-range subsetting, so no risk
// of missing glyphs) instead. Read once at module scope since this
// doesn't depend on request data.
async function loadGoogleFont(family: string, weight: number, italic: boolean): Promise<ArrayBuffer> {
  const axis = italic ? `1,${weight}` : `0,${weight}`;
  const css = await fetch(`https://fonts.googleapis.com/css2?family=${family}:ital,wght@${axis}&display=swap`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Linux; U; Android 4.2.2; en-us; Nexus 4 Build/JDQ39E) AppleWebKit/535.19 (KHTML, like Gecko) Version/4.0 Safari/535.19",
    },
  }).then((res) => res.text());
  const fontUrl = css.match(/src: url\(([^)]+)\) format\('(?:truetype|opentype)'\)/)?.[1];
  if (!fontUrl) throw new Error(`${family} font (weight ${weight}, italic ${italic}) not found in Google Fonts response`);
  return fetch(fontUrl).then((res) => res.arrayBuffer());
}

// Inter for the kicker/subhead — matches the plain sans body font the
// real homepage inherits for that text; Fraunces is reserved for the
// headline. Without a distinct default, Satori falls back to whichever
// custom font is registered, which put the whole card in serif italic.
const [frauncesRegular, frauncesItalicSemibold, interRegular, interSemibold] = await Promise.all([
  loadGoogleFont("Fraunces", 400, false),
  loadGoogleFont("Fraunces", 600, true),
  loadGoogleFont("Inter", 400, false),
  loadGoogleFont("Inter", 600, false),
]);

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: BG,
          padding: "64px 72px",
          position: "relative",
        }}
      >
        {scatterDots(30, 7).map((d, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              position: "absolute",
              left: d.x,
              top: d.y,
              width: d.size,
              height: d.size,
              borderRadius: 2,
              background: d.color,
              opacity: d.opacity,
            }}
          />
        ))}

        <div
          style={{
            display: "flex",
            fontFamily: "Inter",
            fontWeight: 600,
            fontSize: 22,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "rgba(244, 244, 242, 0.55)",
          }}
        >
          Portfolio Platform
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ display: "flex", fontFamily: "Fraunces", fontWeight: 400, fontSize: 88, lineHeight: 1.05, color: TEXT }}>
              Not everyone
            </span>
            <span
              style={{
                display: "flex",
                fontFamily: "Fraunces",
                fontStyle: "italic",
                fontWeight: 600,
                fontSize: 88,
                lineHeight: 1.05,
                color: ACCENT,
              }}
            >
              gets in.
            </span>
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "Inter",
              fontWeight: 400,
              fontSize: 27,
              color: "rgba(244, 244, 242, 0.62)",
              maxWidth: 760,
              marginTop: 28,
              lineHeight: 1.5,
            }}
          >
            A private platform for portfolios — held to an invitation, not an open door.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: interRegular, weight: 400, style: "normal" },
        { name: "Inter", data: interSemibold, weight: 600, style: "normal" },
        { name: "Fraunces", data: frauncesRegular, weight: 400, style: "normal" },
        { name: "Fraunces", data: frauncesItalicSemibold, weight: 600, style: "italic" },
      ],
    },
  );
}
