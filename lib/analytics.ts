import { prisma } from "@/lib/db";

// Substring match, case-insensitive, against known link-preview
// unfurlers (Slack/Discord/Twitter/etc. all fetch the real page to
// scrape its <meta> tags, not just the opengraph-image route) and
// generic crawlers/scripts — otherwise every shared link would count
// itself as a "view" the moment it's posted anywhere.
const BOT_UA_PATTERNS = [
  "bot",
  "spider",
  "crawl",
  "facebookexternalhit",
  "slackbot",
  "discordbot",
  "telegrambot",
  "whatsapp",
  "linkedinbot",
  "skypeuripreview",
  "pinterest",
  "vercel",
  "curl",
  "wget",
  "python-requests",
  "go-http-client",
  "node-fetch",
  "postmanruntime",
  "headlesschrome",
];

export function isBotUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return true; // real browsers always send one — a missing UA is almost always a script
  const ua = userAgent.toLowerCase();
  return BOT_UA_PATTERNS.some((pattern) => ua.includes(pattern));
}

// Called from the public page's Server Component render — never lets
// a DB hiccup break the page for a visitor, since recording a view is
// far less important than the page actually loading.
export async function recordPageView(portfolioId: string, source: "DIRECT" | "QR", userAgent: string | null): Promise<void> {
  if (isBotUserAgent(userAgent)) return;
  try {
    await prisma.pageView.create({ data: { portfolioId, source } });
  } catch (err) {
    console.warn("Failed to record page view:", err);
  }
}

export interface PortfolioStats {
  total: number;
  last7d: number;
  last30d: number;
  direct: number;
  qr: number;
  daily: { date: string; count: number }[]; // last 14 days, oldest first
}

export async function getPortfolioStats(portfolioId: string): Promise<PortfolioStats> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  // UTC day boundaries throughout — createdAt.toISOString() below is
  // always UTC, so bucketing against a *local* midnight (e.g. via
  // setHours) silently drifts by the server's UTC offset: a bucket
  // seeded for "today" wouldn't match today's real views, and a 15th,
  // unseeded bucket would get created for whichever UTC day the views
  // actually fell on instead.
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const fourteenDaysAgo = new Date(todayUtc);
  fourteenDaysAgo.setUTCDate(fourteenDaysAgo.getUTCDate() - 13);

  const [total, last7d, last30d, bySource, recentViews] = await Promise.all([
    prisma.pageView.count({ where: { portfolioId } }),
    prisma.pageView.count({ where: { portfolioId, createdAt: { gte: sevenDaysAgo } } }),
    prisma.pageView.count({ where: { portfolioId, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.pageView.groupBy({ by: ["source"], where: { portfolioId }, _count: true }),
    prisma.pageView.findMany({
      where: { portfolioId, createdAt: { gte: fourteenDaysAgo } },
      select: { createdAt: true },
    }),
  ]);

  const direct = bySource.find((row) => row.source === "DIRECT")?._count ?? 0;
  const qr = bySource.find((row) => row.source === "QR")?._count ?? 0;

  // Bucket into UTC day strings rather than a SQL date_trunc — at this
  // data volume (one portfolio's views, 14 days) doing it in JS is
  // simpler than fighting timezone semantics in the query itself.
  const buckets = new Map<string, number>();
  for (let i = 0; i < 14; i++) {
    const d = new Date(fourteenDaysAgo);
    d.setUTCDate(d.getUTCDate() + i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const view of recentViews) {
    const key = view.createdAt.toISOString().slice(0, 10);
    // Every key here is already one of the 14 seeded above (both sides
    // now compute UTC day boundaries the same way) — .has() is just a
    // defensive guard against ever silently growing a 15th bucket.
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return {
    total,
    last7d,
    last30d,
    direct,
    qr,
    daily: Array.from(buckets.entries()).map(([date, count]) => ({ date, count })),
  };
}
