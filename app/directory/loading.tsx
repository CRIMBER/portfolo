import { SkeletonBlock } from "@/components/Skeleton";
import styles from "@/components/directory/directory.module.css";

// Directory is `force-dynamic` (re-queries + re-rolls the featured
// pick on every request — see page.tsx), so this shows on every
// visit, not just the first. Reuses the real page's own layout
// classes so nothing shifts when the grid swaps in.
export default function DirectoryLoading() {
  return (
    <main className={styles.directoryMain}>
      <div className={styles.headerRow}>
        <div className={styles.intro}>
          <SkeletonBlock width={170} height={34} />
          <SkeletonBlock width="85%" height={14} />
          <SkeletonBlock width={130} height={12} />
        </div>
        <div className={styles.headerActions}>
          <SkeletonBlock width={72} height={36} radius={9} />
          <SkeletonBlock width={92} height={36} radius={9} />
        </div>
      </div>

      <SkeletonBlock width={360} height={40} radius={9} />

      <div className={styles.grid}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="panel" style={{ minHeight: 130 }}>
            <SkeletonBlock width="55%" height={18} />
            <SkeletonBlock width="85%" height={13} />
            <SkeletonBlock width={72} height={20} radius={999} />
          </div>
        ))}
      </div>
    </main>
  );
}
