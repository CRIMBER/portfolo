interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  wordmark?: string;
}

// Auto-generated placeholder mark — a monogram badge in the app's
// existing accent gradient (same one .gradientText and the primary
// button already use), so it reads as part of the same system rather
// than a bolted-on asset. Swap for a real brand mark later; sized via
// props so it can be reused (e.g. in the dashboard header) without
// rework.
export function Logo({ size = 40, showWordmark = true, wordmark = "Portfolio Platform" }: LogoProps) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <span
        aria-hidden="true"
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.28,
          background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--accent-text)",
          fontWeight: 800,
          fontSize: size * 0.5,
          lineHeight: 1,
          flexShrink: 0,
          boxShadow: "var(--shadow-sm)",
        }}
      >
        P
      </span>
      {showWordmark && <span style={{ fontWeight: 800, fontSize: size * 0.42, letterSpacing: "-0.02em" }}>{wordmark}</span>}
    </div>
  );
}
