import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { parseThemeConfig } from "@/lib/theme/validate";
import { parseCanvasElement } from "@/lib/canvas/validate";
import { stableSlugUrl, generateQrSvg, generateQrPngDataUrl } from "@/lib/qr";
import { getPortfolioStats, type PortfolioStats } from "@/lib/analytics";
import { toPortfolioMedia } from "@/components/portfolio/PortfolioRenderer";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "@/components/icons";
import { UsernameForm } from "./username-form";
import { PortfolioStudio } from "./portfolio-studio";
import { togglePublish } from "./actions";
import styles from "./dashboard.module.css";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.member) {
    redirect("/login");
  }
  const { member } = session;

  if (member.status !== "APPROVED") {
    return (
      <main>
        <h1>Dashboard</h1>
        <div className="panel">
          <span className="badge" data-tone={member.status === "PENDING" ? "warning" : "danger"}>
            {member.status}
          </span>
          {member.status === "PENDING" && (
            <p>The platform owner needs to approve your account before you can build a portfolio.</p>
          )}
        </div>
        <SignOutForm />
      </main>
    );
  }

  const portfolio = await prisma.portfolio.findUnique({
    where: { memberId: member.id },
    select: {
      id: true,
      published: true,
      stableSlug: true,
      displayName: true,
      tagline: true,
      bio: true,
      aboutLong: true,
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
      socialLinks: { select: { id: true, platform: true, url: true } },
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
  });

  const theme = portfolio ? parseThemeConfig(portfolio.themeConfig) : null;
  const qrUrl = portfolio ? stableSlugUrl(portfolio.stableSlug) : null;
  const qrSvg = qrUrl ? await generateQrSvg(qrUrl) : null;
  const qrPngDataUrl = qrUrl ? await generateQrPngDataUrl(qrUrl) : null;
  const stats = portfolio ? await getPortfolioStats(portfolio.id) : null;

  return (
    <main>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h1>Dashboard</h1>
          <div style={{ display: "flex", gap: 6 }}>
            <span className="badge" data-tone="success">
              Approved
            </span>
            {member.isOwner && (
              <span className="badge" data-tone="accent">
                Owner
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="/directory" className="btn-secondary">
            Directory
          </a>
          {member.isOwner && (
            <a href="/admin" className="btn-secondary">
              Admin
            </a>
          )}
          <SignOutForm />
        </div>
      </div>

      {portfolio ? (
        <>
          <GettingStarted username={member.username} />

          <ProfileCompleteness
            displayName={portfolio.displayName}
            tagline={portfolio.tagline}
            bio={portfolio.bio}
            projectsCount={portfolio.projects.length}
            socialLinksCount={portfolio.socialLinks.length}
            published={portfolio.published}
          />

          <section className="panel" id="publish-toggle">
            <UsernameForm currentUsername={member.username} />

            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span className="badge" data-tone={portfolio.published ? "success" : undefined}>
                {portfolio.published ? "Published" : "Unpublished"}
              </span>
              <form
                action={async () => {
                  "use server";
                  await togglePublish();
                }}
              >
                <button type="submit" className="btn-secondary">
                  {portfolio.published ? "Unpublish" : "Publish"}
                </button>
              </form>
            </div>

            {member.username && portfolio.published && (
              <p>
                Live at <a href={`/@${member.username}`}>/@{member.username}</a>
              </p>
            )}
          </section>

          <section className="panel">
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <h3>QR code</h3>
              <p style={{ margin: 0, fontSize: "0.85rem" }}>
                Always points at <code>{qrUrl}</code> — printable now, stays valid even if you change your username later.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              {qrSvg && (
                <div
                  style={{
                    background: "#fff",
                    padding: 12,
                    borderRadius: 8,
                    width: 160,
                    height: 160,
                    boxSizing: "border-box",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
              )}
              {qrPngDataUrl && (
                <a href={qrPngDataUrl} download={`${member.username ?? "portfolio"}-qr.png`} className="btn-secondary">
                  Download PNG
                </a>
              )}
            </div>
          </section>

          {stats && <ViewsPanel stats={stats} />}

          <div id="studio">
            <h2>Studio</h2>
            <p style={{ marginTop: 4 }}>
              Everything below — theme and canvas — edits one live preview instantly. Nothing saves until you press Save.
            </p>
          </div>
          <PortfolioStudio
            initialTheme={theme!}
            initialCanvasElements={portfolio.canvasElements.map((el) => parseCanvasElement(el)).filter((el) => el !== null)}
            handle={member.username ?? "yourhandle"}
            initialDisplayName={portfolio.displayName}
            initialTagline={portfolio.tagline}
            initialBio={portfolio.bio}
            initialAboutLong={portfolio.aboutLong}
            initialProjects={portfolio.projects.map((p) => ({ ...p, media: toPortfolioMedia(p.media) }))}
            initialSocialLinks={portfolio.socialLinks}
          />
        </>
      ) : (
        <p>No portfolio found for this account.</p>
      )}
    </main>
  );
}

function ViewsPanel({ stats }: { stats: PortfolioStats }) {
  return (
    <section className="panel">
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <h3>Views</h3>
        <p style={{ margin: 0, fontSize: "0.85rem" }}>
          Counted from real visits to your published page — link-preview bots and crawlers are filtered out.
        </p>
      </div>
      <div className={styles.statGrid}>
        <Stat label="Total" value={stats.total} />
        <div className={styles.statWithTrend}>
          <Stat label="Last 7 days" value={stats.last7d} />
          <TrendBadge current={stats.last7d} previous={stats.prev7d} />
        </div>
        <Stat label="Last 30 days" value={stats.last30d} />
        <Stat label="Direct" value={stats.direct} />
        <Stat label="Via QR" value={stats.qr} />
      </div>
      {stats.total > 0 && <ViewsChart daily={stats.daily} />}
      <SourceSplitBar direct={stats.direct} qr={stats.qr} />
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.statTile}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

function TrendBadge({ current, previous }: { current: number; previous: number }) {
  if (current === 0 && previous === 0) return null;
  const deltaPct = previous === 0 ? null : Math.round(((current - previous) / previous) * 100);
  const up = current >= previous;
  return (
    <span className={`${styles.trendBadge} ${up ? styles.trendUp : styles.trendDown}`}>
      {up ? <ChevronUpIcon size={11} /> : <ChevronDownIcon size={11} />}
      {deltaPct === null ? "new" : `${Math.abs(deltaPct)}%`}
    </span>
  );
}

function SourceSplitBar({ direct, qr }: { direct: number; qr: number }) {
  const total = direct + qr;
  if (total === 0) return null;
  const directPct = Math.round((direct / total) * 100);
  return (
    <div>
      <div className={styles.splitBar}>
        <div className={styles.splitSegmentDirect} style={{ width: `${directPct}%` }} />
        <div className={styles.splitSegmentQr} style={{ width: `${100 - directPct}%` }} />
      </div>
      <div className={styles.splitLegend}>
        <span>
          <i className={`${styles.legendDot} ${styles.legendDotDirect}`} /> Direct {directPct}%
        </span>
        <span>
          <i className={`${styles.legendDot} ${styles.legendDotQr}`} /> QR {100 - directPct}%
        </span>
      </div>
    </div>
  );
}

// Plain divs rather than SVG <rect>/<title> — this app's Next.js
// metadata/title management appears to reach into and empty out any
// <title> element in the tree, not just the document head's, which
// silently killed SVG-native hover tooltips. A real `title` attribute
// on an HTML element has no such ambiguity and works everywhere.
//
// Zero-count days render as a flat, muted bar sitting on a visible
// baseline rather than a scaled-down copy of the filled style — with
// sparse data (a handful of views concentrated on one day) that used
// to make the one real day look like a stray floating box instead of
// the peak of an otherwise-flat chart.
function ViewsChart({ daily }: { daily: { date: string; count: number }[] }) {
  const max = Math.max(1, ...daily.map((d) => d.count));

  return (
    <div className={styles.chartWrap}>
      {daily.map((d) => {
        const isEmpty = d.count === 0;
        const pct = isEmpty ? 0 : Math.max(12, Math.round((d.count / max) * 100));
        return (
          <div
            key={d.date}
            title={`${d.date}: ${d.count} view${d.count === 1 ? "" : "s"}`}
            className={`${styles.chartBar} ${isEmpty ? styles.chartBarEmpty : styles.chartBarFilled}`}
            style={isEmpty ? undefined : { height: `${pct}%` }}
          />
        );
      })}
    </div>
  );
}

// Always visible, no dismiss state — same precedent as GettingStarted
// below (a plain always-shown panel, not a dismiss-and-remember one),
// simplest thing that nudges an incomplete profile without extra
// state to track.
function ProfileCompleteness({
  displayName,
  tagline,
  bio,
  projectsCount,
  socialLinksCount,
  published,
}: {
  displayName: string | null;
  tagline: string | null;
  bio: string | null;
  projectsCount: number;
  socialLinksCount: number;
  published: boolean;
}) {
  const items = [
    { label: "Profile info (name, tagline, bio)", done: !!(displayName && tagline && bio), href: "#studio" },
    { label: "At least one project", done: projectsCount > 0, href: "#studio" },
    { label: "A social link", done: socialLinksCount > 0, href: "#studio" },
    { label: "Published", done: published, href: "#publish-toggle" },
  ];
  const doneCount = items.filter((i) => i.done).length;

  return (
    <section className="panel">
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <h3>Profile checklist</h3>
        <p style={{ margin: 0, fontSize: "0.85rem" }}>
          {doneCount} of {items.length} complete
        </p>
      </div>
      <ul className={styles.checklist}>
        {items.map((item) => (
          <li key={item.label} className={styles.checklistItem}>
            {item.done ? <CheckIcon size={15} className={styles.checklistDone} /> : <span className={styles.checklistCircle} />}
            {item.done ? <span>{item.label}</span> : <a href={item.href}>{item.label}</a>}
          </li>
        ))}
      </ul>
    </section>
  );
}

// A plain-language orientation for members who've never used the
// dashboard before — the Studio section below has grown into a lot
// of controls (theme, intros, canvas, reel), easy to land on and not
// know where to start. Collapsible <details> rather than a
// dismiss-and-remember panel: simplest thing that lets an experienced
// member get it out of the way, with no extra state to track.
function GettingStarted({ username }: { username: string | null }) {
  return (
    <details className="panel" open>
      <summary style={{ cursor: "pointer", fontWeight: 700 }}>New here? Start here</summary>
      <ol style={{ margin: "12px 0 0", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
        <li>
          Pick a look — in the Studio below, open the <strong>Theme</strong> tab and click a starting style to
          instantly reskin your whole page (watch it update live in the preview). Everything it sets stays fully
          editable after.
        </li>
        <li>
          Switch to the <strong>Content</strong> tab to fill in your profile and add your projects (with photos or
          short video clips).
        </li>
        <li>
          Press <strong>Save</strong> in the Studio to store your changes, then come back up here and hit{" "}
          <strong>Publish</strong> to make your page live.
        </li>
        <li>
          Your page lives at <code>/@{username ?? "yourhandle"}</code> — share that link, or hand out the{" "}
          <strong>QR code</strong> below (anyone who scans it lands straight on your live page).
        </li>
      </ol>
    </details>
  );
}

function SignOutForm() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button type="submit" className="btn-secondary">
        Sign out
      </button>
    </form>
  );
}
