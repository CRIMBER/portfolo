import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { parseThemeConfig } from "@/lib/theme/validate";
import { parseCanvasElement } from "@/lib/canvas/validate";
import { PortfolioRenderer, toPortfolioMedia } from "@/components/portfolio/PortfolioRenderer";
import { recordPageView } from "@/lib/analytics";

// Reached via the /@username -> /u/username rewrite in proxy.ts, so
// this also drives the <title>/description a visitor sees when they
// share a /@username link, not just the /u/username one Next resolves.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const member = await prisma.member.findUnique({
    where: { username },
    select: { portfolio: { select: { displayName: true, tagline: true, bio: true, published: true } } },
  });

  if (!member?.portfolio?.published) {
    return { title: "Portfolio not found" };
  }

  const { displayName, tagline, bio } = member.portfolio;
  const title = displayName ?? `@${username}`;
  const description = tagline ?? bio ?? undefined;

  return {
    title,
    description,
    openGraph: { title, description, type: "profile" },
    // "summary_large_image" matches the 1200x630 opengraph-image.tsx
    // sibling in this route — Next auto-attaches it to both here.
    twitter: { card: "summary_large_image", title, description },
  };
}

// Reached via the /@username -> /u/username rewrite in proxy.ts.
// Public, unauthenticated route — Visitors never need an account.
// Also the sole place a page view gets recorded (see lib/analytics.ts)
// — QR scans arrive here via /p/[stableSlug]'s ?src=qr redirect rather
// than being counted separately at that route, so there's exactly one
// recording point per real visit, never two.
export default async function PublicPortfolioPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ src?: string }>;
}) {
  const { username } = await params;
  const { src } = await searchParams;

  const member = await prisma.member.findUnique({
    where: { username },
    select: {
      portfolio: {
        select: {
          id: true,
          displayName: true,
          tagline: true,
          bio: true,
          aboutLong: true,
          published: true,
          themeConfig: true,
          projects: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              description: true,
              role: true,
              technologies: true,
              collaborators: true,
              githubUrl: true,
              demoUrl: true,
              researchUrl: true,
              media: {
                orderBy: { order: "asc" },
                select: { id: true, type: true, url: true, durationSeconds: true },
              },
            },
          },
          socialLinks: {
            select: { id: true, platform: true, url: true },
          },
          canvasElements: {
            orderBy: { zIndex: "asc" },
            select: {
              id: true,
              type: true,
              content: true,
              xPct: true,
              yPx: true,
              widthPct: true,
              heightPx: true,
              rotationDeg: true,
              zIndex: true,
              style: true,
              animations: true,
            },
          },
        },
      },
    },
  });

  if (!member || !member.portfolio || !member.portfolio.published) {
    notFound();
  }

  const { id: portfolioId, displayName, tagline, bio, aboutLong, themeConfig, projects, socialLinks, canvasElements } = member.portfolio;

  const userAgent = (await headers()).get("user-agent");
  await recordPageView(portfolioId, src === "qr" ? "QR" : "DIRECT", userAgent);

  return (
    <PortfolioRenderer
      theme={parseThemeConfig(themeConfig)}
      handle={username}
      displayName={displayName}
      tagline={tagline}
      bio={bio}
      aboutLong={aboutLong}
      projects={projects.map((p) => ({ ...p, media: toPortfolioMedia(p.media) }))}
      socialLinks={socialLinks}
      canvasElements={canvasElements.map((el) => parseCanvasElement(el)).filter((el) => el !== null)}
      viaQr={src === "qr"}
    />
  );
}
