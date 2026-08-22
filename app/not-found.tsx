import Link from "next/link";

export default function NotFound() {
  return (
    <main className="narrow">
      <div className="panel" style={{ textAlign: "center", alignItems: "center" }}>
        <span className="badge" data-tone="warning">
          404
        </span>
        <h1>Page not found</h1>
        <p>That page doesn&rsquo;t exist, or the portfolio hasn&rsquo;t been published yet.</p>
        <Link href="/" className="btn-secondary">
          Back home
        </Link>
      </div>
    </main>
  );
}
