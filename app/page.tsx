import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main className="narrow">
      <div className="panel" style={{ textAlign: "center", alignItems: "center" }}>
        <h1>Portfolio Platform</h1>
        {session?.member ? (
          <>
            <span className="badge" data-tone="success">
              Signed in — {session.member.status}
            </span>
            <a href={session.member.isOwner ? "/admin" : "/dashboard"} className="btn-secondary">
              Go to dashboard
            </a>
          </>
        ) : (
          <a href="/login" className="btn-secondary">
            Sign in
          </a>
        )}
        <a href="/directory" className="btn-secondary">
          Browse the directory
        </a>
      </div>
    </main>
  );
}
