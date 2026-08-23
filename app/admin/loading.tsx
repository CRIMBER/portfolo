import { SkeletonBlock } from "@/components/Skeleton";
import styles from "./admin.module.css";

export default function AdminLoading() {
  return (
    <main>
      <div className={styles.header}>
        <SkeletonBlock width={110} height={30} />
        <SkeletonBlock width={140} height={36} radius={9} />
      </div>
      <SkeletonBlock width="65%" height={13} />

      <div className={styles.statRow}>
        {[0, 1, 2].map((i) => (
          <div key={i} className={styles.statTile}>
            <SkeletonBlock width={28} height={24} />
            <SkeletonBlock width={50} height={10} />
          </div>
        ))}
      </div>

      <div className="panel">
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <SkeletonBlock width={30} height={30} radius={999} />
            <SkeletonBlock width="35%" height={13} />
            <SkeletonBlock width={70} height={20} radius={999} />
          </div>
        ))}
      </div>
    </main>
  );
}
