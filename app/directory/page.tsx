import type { Metadata } from "next";
import { auth } from "@/auth";
import { getDirectoryEntries, pickRandomIndex } from "@/lib/directory";
import { DirectoryGrid } from "@/components/directory/DirectoryGrid";
import styles from "@/components/directory/directory.module.css";

export const metadata: Metadata = {
  title: "Directory",
  description: "Browse every published portfolio.",
};

// Next would otherwise statically prerender this at build time (no
// cookies/headers/searchParams usage to signal otherwise) and freeze
// both the member list and the featured pick as of that build —
// forced dynamic so every request re-queries and re-rolls the
// spotlight live.
export const dynamic = "force-dynamic";

// Public, unauthenticated — same as /@username. A different random
// member gets the "Featured" slot on every request rather than a
// fixed pin, so the hub doesn't always open on the same face; picked
// server-side (not client-side) so there's no hydration mismatch
// between what the server sent and what the client would've rolled.
export default async function DirectoryPage() {
  const [session, entries] = await Promise.all([auth(), getDirectoryEntries()]);
  const featuredIndex = pickRandomIndex(entries.length);
  const featured = featuredIndex >= 0 ? entries[featuredIndex] : null;
  const rest = entries.filter((_, i) => i !== featuredIndex);

  return (
    <main className={styles.directoryMain}>
      <div className={styles.blobs} aria-hidden="true">
        <span className={styles.blobOne} />
        <span className={styles.blobTwo} />
      </div>

      <div className={styles.headerRow}>
        <div className={styles.intro}>
          <h1 className="gradientText">Directory</h1>
          <p>Every published portfolio, styled the way its owner built it. Browse, click through, get inspired.</p>
          {entries.length > 0 && (
            <span className={styles.count}>
              {entries.length} portfolio{entries.length === 1 ? "" : "s"} and counting
            </span>
          )}
        </div>
        <div className={styles.headerActions}>
          <a href="/" className="btn-secondary">
            Home
          </a>
          {session?.member ? (
            <a href={session.member.isOwner ? "/admin" : "/dashboard"} className="btn-secondary">
              Dashboard
            </a>
          ) : (
            <a href="/login" className="btn-secondary">
              Sign in
            </a>
          )}
        </div>
      </div>

      <DirectoryGrid featured={featured} entries={rest} />
    </main>
  );
}
