import { redirect } from "next/navigation";
import type { MemberStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { CheckIcon, CloseIcon, TrashIcon } from "@/components/icons";
import { approveMember, rejectMember, revokeMember } from "./actions";
import styles from "./admin.module.css";

const STATUS_TONE: Record<MemberStatus, string> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  REVOKED: "danger",
};

export default async function AdminPage() {
  const session = await auth();
  if (!session?.member) {
    redirect("/login");
  }
  if (!session.member.isOwner) {
    redirect("/dashboard");
  }

  // Declaration order in the MemberStatus enum (prisma/schema.prisma)
  // is PENDING, APPROVED, REJECTED, REVOKED — Postgres (and Prisma)
  // sort native enums by that order, not alphabetically, so "asc"
  // here already surfaces the members actually needing a decision
  // first rather than bottom-of-page.
  const members = await prisma.member.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
  });
  const pendingCount = members.filter((m) => m.status === "PENDING" && !m.isOwner).length;
  const approvedCount = members.filter((m) => m.status === "APPROVED" && !m.isOwner).length;

  return (
    <main>
      <div className={styles.header}>
        <h1>Members</h1>
        <a href="/dashboard" className="btn-secondary">
          Back to dashboard
        </a>
      </div>
      <p className={styles.subtitle}>Approve, reject, or revoke access. This does not touch anyone&rsquo;s portfolio content.</p>

      <div className={styles.statRow}>
        <SummaryStat label="Pending" value={pendingCount} tone={pendingCount > 0 ? "warning" : undefined} />
        <SummaryStat label="Approved" value={approvedCount} />
        <SummaryStat label="Total" value={members.length} />
      </div>

      {members.length === 0 ? (
        <div className={`panel ${styles.emptyState}`}>No one has signed in yet.</div>
      ) : (
        <div className={styles.scrollWrap}>
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th className={styles.statusCol}>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const initial = (m.username ?? m.email).charAt(0).toUpperCase();
                const statusBadge = (
                  <span className="badge" data-tone={m.isOwner ? "accent" : STATUS_TONE[m.status]}>
                    {m.isOwner ? "Owner" : m.status}
                  </span>
                );
                return (
                  <tr key={m.id} className={m.status === "PENDING" && !m.isOwner ? styles.pendingRow : undefined}>
                    <td>
                      <div className={styles.memberCell}>
                        <span className={styles.avatar} aria-hidden="true">
                          {initial}
                        </span>
                        <div className={styles.memberText}>
                          <span className={styles.email}>{m.email}</span>
                          <span className={styles.username}>{m.username ? `@${m.username}` : "no username yet"}</span>
                          <span className={styles.statusInlineWrap}>{statusBadge}</span>
                        </div>
                      </div>
                    </td>
                    <td className={styles.statusCol}>{statusBadge}</td>
                    <td>
                      {!m.isOwner && (
                        <div className={styles.actions}>
                          <form action={approveMember.bind(null, m.id)}>
                            <button
                              type="submit"
                              className={styles.actionBtn}
                              disabled={m.status === "APPROVED"}
                              title="Approve"
                              aria-label={`Approve ${m.email}`}
                            >
                              <CheckIcon size={13} />
                              <span className={styles.actionLabel}>Approve</span>
                            </button>
                          </form>
                          <form action={rejectMember.bind(null, m.id)}>
                            <button
                              type="submit"
                              className={`btn-secondary ${styles.actionBtn}`}
                              disabled={m.status === "REJECTED"}
                              title="Reject"
                              aria-label={`Reject ${m.email}`}
                            >
                              <CloseIcon size={13} />
                              <span className={styles.actionLabel}>Reject</span>
                            </button>
                          </form>
                          <form action={revokeMember.bind(null, m.id)}>
                            <button
                              type="submit"
                              className={`btn-secondary ${styles.actionBtn}`}
                              data-tone="danger"
                              disabled={m.status === "REVOKED"}
                              title="Revoke"
                              aria-label={`Revoke ${m.email}`}
                            >
                              <TrashIcon size={13} />
                              <span className={styles.actionLabel}>Revoke</span>
                            </button>
                          </form>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: number; tone?: "warning" }) {
  return (
    <div className={styles.statTile}>
      <span className={`${styles.statValue} ${tone === "warning" ? styles.statValueWarning : ""}`}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}
