"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="narrow">
      <div className="panel" style={{ textAlign: "center", alignItems: "center" }}>
        <span className="badge" data-tone="danger">
          Error
        </span>
        <h1>Something went wrong</h1>
        <p>An unexpected error occurred. You can try again, or head back home.</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={reset}>
            Try again
          </button>
          <Link href="/" className="btn-secondary">
            Back home
          </Link>
        </div>
      </div>
    </main>
  );
}
