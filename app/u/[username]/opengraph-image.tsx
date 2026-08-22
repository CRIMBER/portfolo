import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";
import { parseThemeConfig } from "@/lib/theme/validate";

// File-convention route (see Next's Metadata Files docs) — Next
// renders this once per request to a member's /@username page and
// auto-attaches the result to both openGraph.images and (as
// "summary_large_image") twitter:image in generateMetadata above, so
// there's nothing to wire up on that end.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FALLBACK_BG = "#0f0f12";
const FALLBACK_TEXT = "#f2f2f5";

export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  const member = await prisma.member.findUnique({
    where: { username },
    select: { portfolio: { select: { displayName: true, tagline: true, published: true, themeConfig: true } } },
  });

  if (!member?.portfolio?.published) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: FALLBACK_BG,
            color: FALLBACK_TEXT,
            fontSize: 48,
            fontWeight: 700,
          }}
        >
          Portfolio
        </div>
      ),
      size,
    );
  }

  const theme = parseThemeConfig(member.portfolio.themeConfig);
  const name = member.portfolio.displayName ?? `@${username}`;
  const tagline = member.portfolio.tagline;

  // Only "solid"/"gradient" are safe as a raw CSS background string for
  // Satori (what ImageResponse renders with) — image/texture/particles
  // backgrounds fall back to the flat surface color, same defensive
  // choice lib/theme/css-vars.ts makes for the live page.
  const background =
    theme.background.kind === "solid" || theme.background.kind === "gradient" ? theme.background.value : theme.colors.background;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background,
          position: "relative",
          padding: "80px",
        }}
      >
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: -140,
            right: -120,
            width: 440,
            height: 440,
            borderRadius: "50%",
            background: theme.colors.primary,
            opacity: 0.32,
          }}
        />
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: -180,
            left: -120,
            width: 380,
            height: 380,
            borderRadius: "50%",
            background: theme.colors.accent,
            opacity: 0.22,
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            height: "100%",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 28,
              fontWeight: 700,
              color: theme.colors.primary,
              letterSpacing: 3,
              textTransform: "uppercase",
              marginBottom: 28,
            }}
          >
            @{username}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 72,
              fontWeight: 800,
              color: theme.colors.text,
              lineHeight: 1.08,
              maxWidth: 980,
            }}
          >
            {name}
          </div>
          {tagline && (
            <div
              style={{
                display: "flex",
                fontSize: 32,
                color: theme.colors.textMuted,
                marginTop: 26,
                maxWidth: 900,
              }}
            >
              {tagline}
            </div>
          )}
        </div>
      </div>
    ),
    size,
  );
}
