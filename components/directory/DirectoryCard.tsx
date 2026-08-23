import Link from "next/link";
import type { CSSProperties } from "react";
import type { DirectoryEntry } from "@/lib/directory";
import { HOVER_CLASS } from "@/components/portfolio/PortfolioRenderer";
import styles from "./directory.module.css";

// Each card is themed with that member's own saved colors/background
// rather than one house style, and reuses their actual chosen hover
// preset (see HOVER_CLASS) — browsing the grid previews what their
// real page feels like before you click through.
export function DirectoryCard({
  entry,
  featured = false,
  index = 0,
}: {
  entry: DirectoryEntry;
  featured?: boolean;
  index?: number;
}) {
  const hoverClass = entry.hoverPresetId ? HOVER_CLASS[entry.hoverPresetId] : undefined;
  const cardClassName = [styles.card, featured ? styles.featuredCard : "", hoverClass].filter(Boolean).join(" ");
  const name = entry.displayName || `@${entry.username}`;

  return (
    <Link
      href={`/@${entry.username}`}
      className={cardClassName}
      style={
        {
          background: entry.backgroundCss,
          color: entry.colors.text,
          "--tc-color-primary": entry.colors.primary,
          // Caps the entrance stagger so a large directory doesn't push
          // the last cards' fade-in delay out several seconds.
          "--i": Math.min(index, 10),
        } as CSSProperties
      }
    >
      <h3 className={styles.cardName}>{name}</h3>
      {entry.tagline && <p className={styles.cardTagline}>{entry.tagline}</p>}
      <span
        className={styles.personalityBadge}
        style={{ background: entry.colors.surface, color: entry.colors.text }}
      >
        {entry.personality}
      </span>
    </Link>
  );
}
