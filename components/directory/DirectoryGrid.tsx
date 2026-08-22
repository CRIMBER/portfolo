"use client";

import { useMemo, useState } from "react";
import type { DirectoryEntry } from "@/lib/directory";
import { DirectoryCard } from "./DirectoryCard";
import styles from "./directory.module.css";

interface DirectoryGridProps {
  featured: DirectoryEntry | null;
  entries: DirectoryEntry[];
}

// The featured spotlight (picked server-side, once per page load — see
// app/directory/page.tsx) only makes sense as an unfiltered "look at
// this" moment, so it's hidden while actively searching rather than
// competing with the results for attention.
export function DirectoryGrid({ featured, entries }: DirectoryGridProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((entry) => {
      const haystack = `${entry.displayName ?? ""} ${entry.username} ${entry.tagline ?? ""} ${entry.personality}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [query, entries]);

  const showFeatured = featured && query.trim() === "";

  return (
    <>
      <input
        type="search"
        className={styles.searchInput}
        placeholder="Search by name or vibe…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search the directory"
      />

      {showFeatured && (
        <div className={styles.featuredWrap}>
          <span className={styles.featuredLabel}>Featured</span>
          <DirectoryCard entry={featured} featured />
        </div>
      )}

      {filtered.length === 0 ? (
        // Nothing to say here when the featured card above is already
        // showing the platform's one and only portfolio — an empty
        // grid in that case is expected, not a dead end to explain.
        !showFeatured && (
          <p className={styles.emptyState}>{query.trim() === "" ? "No published portfolios yet." : "No matches."}</p>
        )
      ) : (
        <div className={styles.grid}>
          {filtered.map((entry) => (
            <DirectoryCard entry={entry} key={entry.username} />
          ))}
        </div>
      )}
    </>
  );
}
