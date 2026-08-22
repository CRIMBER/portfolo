import { redirect } from "next/navigation";
import type { MemberStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { approveMember, rejectMember, revokeMember } from "./actions";

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <h1>Members</h1>
        <a href="/dashboard" className="btn-secondary">
          Back to dashboard
        </a>
      </div>
      <p style={{ marginTop: -12 }}>Approve, reject, or revoke access. This does not touch anyone&rsquo;s portfolio content.</p>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <SummaryStat label="Pending" value={pendingCount} tone={pendingCount > 0 ? "warning" : undefined} />
        <SummaryStat label="Approved" value={approvedCount} />
        <SummaryStat label="Total" value={members.length} />
      </div>

      {members.length === 0 ? (
        <div className="panel" style={{ alignItems: "center", textAlign: "center", color: "var(--text-muted)" }}>
          No one has signed in yet.
        </div>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Username</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} style={m.status === "PENDING" && !m.isOwner ? { background: "var(--warning-soft)" } : undefined}>
                  <td>{m.email}</td>
                  <td>{m.username ?? "—"}</td>
                  <td>
                    <span className="badge" data-tone={m.isOwner ? "accent" : STATUS_TONE[m.status]}>
                      {m.isOwner ? "Owner" : m.status}
                    </span>
                  </td>
                  <td>
                    {!m.isOwner && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "nowrap" }}>
                        <form action={approveMember.bind(null, m.id)}>
                          <button type="submit" disabled={m.status === "APPROVED"}>
                            Approve
                          </button>
                        </form>
                        <form action={rejectMember.bind(null, m.id)}>
                          <button type="submit" className="btn-secondary" disabled={m.status === "REJECTED"}>
                            Reject
                          </button>
                        </form>
                        <form action={revokeMember.bind(null, m.id)}>
                          <button type="submit" className="btn-secondary" data-tone="danger" disabled={m.status === "REVOKED"}>
                            Revoke
                          </button>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: number; tone?: "warning" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: "1.5rem", fontWeight: 800, lineHeight: 1, color: tone === "warning" ? "var(--warning)" : undefined }}>
        {value}
      </span>
      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{label}</span>
    </div>
  );
}
