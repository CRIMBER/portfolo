import { SkeletonBlock } from "@/components/Skeleton";
import styles from "./dashboard.module.css";

// Mirrors dashboard/page.tsx's real shape (header, Getting started,
// checklist, username/publish, QR, Views, then the Studio's tab row +
// two-column layout) so there's no layout jump once the real content
// — several Prisma queries plus QR generation — finishes loading.
export default function DashboardLoading() {
  return (
    <main>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <SkeletonBlock width={150} height={30} />
          <div style={{ display: "flex", gap: 6 }}>
            <SkeletonBlock width={72} height={20} radius={999} />
            <SkeletonBlock width={56} height={20} radius={999} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <SkeletonBlock width={78} height={36} radius={9} />
          <SkeletonBlock width={64} height={36} radius={9} />
          <SkeletonBlock width={82} height={36} radius={9} />
        </div>
      </div>

      <div className="panel">
        <SkeletonBlock width={170} height={20} />
        <SkeletonBlock width="92%" height={13} />
        <SkeletonBlock width="80%" height={13} />
      </div>

      <div className="panel">
        <SkeletonBlock width={140} height={18} />
        <SkeletonBlock width={90} height={12} />
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 2 }}>
          {[0, 1, 2, 3].map((i) => (
            <SkeletonBlock key={i} width={`${72 - i * 6}%`} height={14} />
          ))}
        </div>
      </div>

      <div className="panel">
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <SkeletonBlock width={220} height={38} />
          <SkeletonBlock width={64} height={38} radius={9} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <SkeletonBlock width={82} height={22} radius={999} />
          <SkeletonBlock width={92} height={36} radius={9} />
        </div>
        <SkeletonBlock width={130} height={13} />
      </div>

      <div className="panel">
        <SkeletonBlock width={80} height={18} />
        <SkeletonBlock width="75%" height={13} />
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <SkeletonBlock width={180} height={180} radius={13} />
          <SkeletonBlock width={110} height={36} radius={9} />
        </div>
      </div>

      <div className="panel">
        <SkeletonBlock width={64} height={18} />
        <SkeletonBlock width="80%" height={13} />
        <div className={styles.statGrid}>
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonBlock key={i} width={92} height={62} radius={13} />
          ))}
        </div>
        <SkeletonBlock width="100%" height={64} radius={9} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <SkeletonBlock width={72} height={22} />
        <SkeletonBlock width="55%" height={13} />
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: "3 1 420px", display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {[86, 72, 78, 84].map((w, i) => (
              <SkeletonBlock key={i} width={w} height={36} radius={9} />
            ))}
          </div>
          <div className="panel" style={{ minHeight: 260 }}>
            <SkeletonBlock width={110} height={18} />
            <SkeletonBlock width="90%" height={13} />
            <SkeletonBlock width="100%" height={40} radius={9} />
            <SkeletonBlock width="100%" height={40} radius={9} />
            <SkeletonBlock width="100%" height={80} radius={9} />
          </div>
        </div>
        <div style={{ flex: "1 1 220px", minWidth: 220 }}>
          <div className="panel">
            <SkeletonBlock width={90} height={16} />
            <SkeletonBlock width="100%" height={200} radius={13} />
          </div>
        </div>
      </div>
    </main>
  );
}
