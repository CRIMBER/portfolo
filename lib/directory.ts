import { prisma } from "@/lib/db";
import { parseThemeConfig } from "@/lib/theme/validate";
import type { ColorConfig, DesignPersonality } from "@/lib/theme/schema";

// A plain helper (not inline in the page component) so the random
// pick lives outside what the React Compiler's purity check analyzes
// as component-render code — Math.random() directly in a Server
// Component body trips "Cannot call impure function during render"
// even though a once-per-request random pick here is exactly the
// intended, harmless use.
export function pickRandomIndex(length: number): number {
  return length > 0 ? Math.floor(Math.random() * length) : -1;
}

export interface DirectoryEntry {
  username: string;
  displayName: string | null;
  tagline: string | null;
  personality: DesignPersonality;
  colors: ColorConfig;
  backgroundCss: string;
  hoverPresetId: string | null;
  lastActiveAt: Date;
}

// Everyone published, themed with their own saved colors/personality/
// hover preset rather than a house style — the point of the hub is
// that browsing it previews each person's actual page. Sorted by
// most recent real visit (see lib/analytics.ts's page-view tracking),
// falling back to last-edited for portfolios nobody's viewed yet so
// they still surface instead of sinking to the bottom forever.
export async function getDirectoryEntries(): Promise<DirectoryEntry[]> {
  const portfolios = await prisma.portfolio.findMany({
    where: { published: true, member: { username: { not: null } } },
    select: {
      displayName: true,
      tagline: true,
      themeConfig: true,
      updatedAt: true,
      member: { select: { username: true } },
      pageViews: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
    },
  });

  return portfolios
    .map((p) => {
      const theme = parseThemeConfig(p.themeConfig);
      const hover = theme.animation.presets.find((preset) => preset.target === "hover");
      const background =
        theme.background.kind === "solid" || theme.background.kind === "gradient" ? theme.background.value : theme.colors.background;
      return {
        username: p.member.username as string,
        displayName: p.displayName,
        tagline: p.tagline,
        personality: theme.personality,
        colors: theme.colors,
        backgroundCss: background,
        hoverPresetId: hover?.presetId ?? null,
        lastActiveAt: p.pageViews[0]?.createdAt ?? p.updatedAt,
      };
    })
    .sort((a, b) => b.lastActiveAt.getTime() - a.lastActiveAt.getTime());
}
