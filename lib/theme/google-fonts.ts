import type { ThemeConfig } from "./schema";

// Member-chosen fonts are arbitrary strings, not a fixed set known at
// build time, so next/font's static imports don't fit — we load them
// the same way any dynamic font picker does, via a generated Google
// Fonts CSS2 stylesheet link rendered in the page.
export function googleFontsHref(theme: ThemeConfig): string {
  const weightsByFamily = new Map<string, Set<number>>();
  const add = (family: string, weight: number) => {
    if (!weightsByFamily.has(family)) weightsByFamily.set(family, new Set());
    weightsByFamily.get(family)!.add(weight);
  };
  add(theme.typography.headingFont, theme.typography.weight.heading);
  add(theme.typography.bodyFont, theme.typography.weight.body);

  const familyParams = [...weightsByFamily.entries()].map(([family, weights]) => {
    const weightList = [...weights].sort((a, b) => a - b).join(";");
    return `family=${encodeURIComponent(family).replace(/%20/g, "+")}:wght@${weightList}`;
  });

  return `https://fonts.googleapis.com/css2?${familyParams.join("&")}&display=swap`;
}
