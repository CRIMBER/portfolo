"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface IntroOverlayProps {
  presetId: string;
  durationMs: number;
  handle: string;
  displayName: string | null;
  tagline: string | null;
  textColor: string;
  accentColor: string;
  backgroundColor: string;
  fontFamily: string;
  // Optional — Server Components (the public page) can't pass inline
  // functions as props, and don't need to react to completion anyway.
  // Only the dashboard's own "Preview" button (a Client Component)
  // supplies a real one, to reset its own local state.
  onDone?: () => void;
  // Skips the once-per-session gate and the reduced-motion check —
  // used only by the dashboard's own "Preview" button, an explicit
  // manual trigger, never on the public page's automatic autoplay.
  bypassGate?: boolean;
  // Appended to the sessionStorage gate key so the regular intro and
  // the QR-arrival intro (PortfolioRenderer picks one or the other
  // per visit) each get their own once-per-session memory instead of
  // seeing one suppressing the other.
  sessionKeySuffix?: string;
}

// Plays once per browser session per portfolio (sessionStorage-gated)
// and never at all under prefers-reduced-motion. Only ever mounted on
// the real public page (fullHeight=true) — see PortfolioRenderer —
// so live-editing in the dashboard is never interrupted by it.
export function IntroOverlay({
  presetId,
  durationMs,
  handle,
  displayName,
  tagline,
  textColor,
  accentColor,
  backgroundColor,
  fontFamily,
  onDone,
  bypassGate = false,
  sessionKeySuffix,
}: IntroOverlayProps) {
  const [playing, setPlaying] = useState(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    if (bypassGate) {
      // Synchronous sessionStorage/matchMedia reads can't happen
      // during SSR (no `window`), so this genuinely has to resolve
      // after mount rather than from the initial render — not
      // avoidable state derivation, it's synchronizing with a
      // browser-only external source.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlaying(true);
      const timer = setTimeout(() => setPlaying(false), durationMs);
      return () => clearTimeout(timer);
    }

    const key = `intro-seen:${handle}${sessionKeySuffix ? `:${sessionKeySuffix}` : ""}`;
    let seen = false;
    try {
      seen = sessionStorage.getItem(key) === "1";
    } catch {
      // sessionStorage unavailable (private browsing, etc.) — treat as unseen.
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || reduced) {
      onDoneRef.current?.();
      return;
    }
    try {
      sessionStorage.setItem(key, "1");
    } catch {
      // Non-fatal — worst case the intro replays on the next load.
    }
    setPlaying(true);
    const timer = setTimeout(() => setPlaying(false), durationMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot on mount, onDone accessed via ref
  }, []);

  const name = displayName ?? `@${handle}`;

  return (
    <AnimatePresence onExitComplete={onDone}>
      {playing && (
        <motion.div
          onClick={() => setPlaying(false)}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: backgroundColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily,
            overflow: "hidden",
            cursor: "pointer",
            padding: "0 24px",
            textAlign: "center",
          }}
        >
          {presetId === "glitch-boot" && <GlitchBoot name={name} color={textColor} accent={accentColor} />}
          {presetId === "particle-converge" && <ParticleConverge name={name} color={textColor} accent={accentColor} />}
          {presetId === "typewriter-name" && <TypewriterName name={name} color={textColor} accent={accentColor} />}
          {presetId === "curtain-wipe" && <CurtainWipe name={name} color={textColor} accent={accentColor} />}
          {presetId === "logo-reveal" && <LogoReveal name={name} tagline={tagline} color={textColor} accent={accentColor} />}
          {presetId === "scanner-frame" && <ScannerFrame name={name} color={textColor} accent={accentColor} />}
          {presetId === "scan-line-sweep" && <ScanLineSweep name={name} color={textColor} accent={accentColor} />}
          {presetId === "pixelate-resolve" && <PixelateResolve name={name} color={textColor} accent={accentColor} />}
          <span
            style={{
              position: "absolute",
              bottom: 16,
              right: 20,
              fontSize: "0.75rem",
              opacity: 0.5,
              color: textColor,
            }}
          >
            Skip ›
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LogoReveal({ name, tagline, color, accent }: { name: string; tagline: string | null; color: string; accent: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <motion.h1
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 16 }}
        style={{ color, fontSize: "clamp(1.8rem, 8vw, 3rem)", fontWeight: 700, margin: 0, overflowWrap: "break-word" }}
      >
        {name}
      </motion.h1>
      {tagline && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          style={{ color: accent, marginTop: 12, fontSize: "1.1rem" }}
        >
          {tagline}
        </motion.p>
      )}
    </div>
  );
}

function GlitchBoot({ name, color, accent }: { name: string; color: string; accent: string }) {
  const lines = ["initializing_portfolio", `loading ${name}`, "ready."];
  return (
    <div style={{ fontFamily: "ui-monospace, monospace", fontSize: "clamp(0.85rem, 3.5vw, 1.1rem)", textAlign: "left" }}>
      {lines.map((line, i) => (
        <motion.div
          key={line}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, x: [6, -3, 1.5, 0] }}
          transition={{ delay: i * 0.35, duration: 0.3 }}
          style={{ color: i === lines.length - 1 ? color : accent }}
        >
          {`> ${line}`}
        </motion.div>
      ))}
    </div>
  );
}

function ParticleConverge({ name, color, accent }: { name: string; color: string; accent: string }) {
  const [dots, setDots] = useState<{ x: number; y: number }[]>([]);

  useEffect(() => {
    // Math.random() positions can't be computed during the lazy
    // initializer either — SSR and the client hydration pass would
    // each roll different values, which is a worse mismatch than
    // starting empty and filling in once mounted.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDots(
      Array.from({ length: 24 }, () => ({
        x: (Math.random() - 0.5) * 100,
        y: (Math.random() - 0.5) * 100,
      })),
    );
  }, []);

  return (
    <div style={{ position: "relative", textAlign: "center" }}>
      {dots.map((d, i) => (
        <motion.span
          key={i}
          initial={{ x: `${d.x}vw`, y: `${d.y}vh`, opacity: 0.8 }}
          animate={{ x: 0, y: 0, opacity: 0 }}
          transition={{ duration: 1.1, ease: "easeIn" }}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: accent,
          }}
        />
      ))}
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        style={{ color, fontSize: "clamp(1.6rem, 7vw, 2.6rem)", fontWeight: 700, margin: 0, position: "relative", overflowWrap: "break-word" }}
      >
        {name}
      </motion.h1>
    </div>
  );
}

// A camera/QR-scanner viewfinder: four corner brackets snap onto the
// screen as if locking onto a code, hold for a beat, then expand
// outward and fade — the "recognition" moment a QR-specific intro
// should feel like, distinct from the generic reveals above.
function ScannerFrame({ name, color, accent }: { name: string; color: string; accent: string }) {
  const bracketLength = 28;
  const thickness = 3;
  const corners: { top?: number; bottom?: number; left?: number; right?: number; borderStyle: CSSProperties }[] = [
    { top: 0, left: 0, borderStyle: { borderTop: `${thickness}px solid ${accent}`, borderLeft: `${thickness}px solid ${accent}` } },
    { top: 0, right: 0, borderStyle: { borderTop: `${thickness}px solid ${accent}`, borderRight: `${thickness}px solid ${accent}` } },
    { bottom: 0, left: 0, borderStyle: { borderBottom: `${thickness}px solid ${accent}`, borderLeft: `${thickness}px solid ${accent}` } },
    { bottom: 0, right: 0, borderStyle: { borderBottom: `${thickness}px solid ${accent}`, borderRight: `${thickness}px solid ${accent}` } },
  ];

  return (
    <div style={{ position: "relative", width: "min(70vw, 220px)", height: "min(70vw, 220px)" }}>
      {corners.map((corner, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, scale: 1.6 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [1.6, 1, 1, 1.5] }}
          transition={{ duration: 1.3, times: [0, 0.25, 0.7, 1], ease: "easeInOut" }}
          style={{
            position: "absolute",
            width: bracketLength,
            height: bracketLength,
            top: corner.top,
            bottom: corner.bottom,
            left: corner.left,
            right: corner.right,
            ...corner.borderStyle,
          }}
        />
      ))}
      <motion.h1
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.45, duration: 0.5 }}
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color,
          fontSize: "clamp(1.3rem, 6vw, 2rem)",
          fontWeight: 700,
          margin: 0,
          textAlign: "center",
          overflowWrap: "break-word",
          padding: "0 8px",
        }}
      >
        {name}
      </motion.h1>
    </div>
  );
}

// A glowing line sweeps top-to-bottom once, with the name revealing
// in its wake via a synced clip-path rather than a plain fade — reads
// as the page being "scanned into" rather than just appearing.
function ScanLineSweep({ name, color, accent }: { name: string; color: string; accent: string }) {
  return (
    <div style={{ position: "relative", width: "min(80vw, 360px)", height: 120 }}>
      <motion.div
        initial={{ clipPath: "inset(0 0 100% 0)" }}
        animate={{ clipPath: "inset(0 0 0% 0)" }}
        transition={{ duration: 0.9, delay: 0.1, ease: "easeInOut" }}
        style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <h1
          style={{
            color,
            fontSize: "clamp(1.4rem, 6.5vw, 2.2rem)",
            fontWeight: 700,
            margin: 0,
            textAlign: "center",
            overflowWrap: "break-word",
            padding: "0 8px",
          }}
        >
          {name}
        </h1>
      </motion.div>
      <motion.div
        initial={{ top: "0%", opacity: 1 }}
        animate={{ top: "100%", opacity: [1, 1, 0] }}
        transition={{ duration: 0.9, delay: 0.1, ease: "easeInOut" }}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: 3,
          background: accent,
          boxShadow: `0 0 16px 2px ${accent}`,
        }}
      />
    </div>
  );
}

// Content starts as a loose grid of blocky squares (echoing the QR
// pattern itself) that fade out while the name comes into sharp focus
// from a heavy blur — a "resolving" feel rather than a straight reveal.
function PixelateResolve({ name, color, accent }: { name: string; color: string; accent: string }) {
  const [blocks, setBlocks] = useState<{ x: number; y: number }[]>([]);

  useEffect(() => {
    // Same SSR/hydration-mismatch reasoning as ParticleConverge above:
    // random positions can only be rolled once mounted on the client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBlocks(
      Array.from({ length: 30 }, (_, i) => ({
        x: (i % 6) * 20 + (Math.random() - 0.5) * 8,
        y: Math.floor(i / 6) * 20 + (Math.random() - 0.5) * 8,
      })),
    );
  }, []);

  return (
    <div style={{ position: "relative", width: "min(70vw, 240px)", height: "min(50vw, 160px)" }}>
      {blocks.map((b, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0.9 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.3 + (i % 6) * 0.03, ease: "easeIn" }}
          style={{
            position: "absolute",
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: "14%",
            height: "16%",
            background: accent,
          }}
        />
      ))}
      <motion.h1
        initial={{ opacity: 0, filter: "blur(14px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.8, delay: 0.25, ease: "easeOut" }}
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color,
          fontSize: "clamp(1.3rem, 6vw, 2rem)",
          fontWeight: 700,
          margin: 0,
          textAlign: "center",
          overflowWrap: "break-word",
          padding: "0 8px",
        }}
      >
        {name}
      </motion.h1>
    </div>
  );
}

function TypewriterName({ name, color, accent }: { name: string; color: string; accent: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "clamp(1.6rem, 7vw, 2.6rem)",
        fontWeight: 700,
        color,
      }}
    >
      {[...name].map((char, i) => (
        <motion.span key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}>
          {char === " " ? " " : char}
        </motion.span>
      ))}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
        style={{ color: accent, marginLeft: 4 }}
      >
        |
      </motion.span>
    </div>
  );
}

function CurtainWipe({ name, color, accent }: { name: string; color: string; accent: string }) {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: "-100%" }}
        transition={{ delay: 0.9, duration: 0.6, ease: "easeInOut" }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", background: accent }}
      />
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: "100%" }}
        transition={{ delay: 0.9, duration: 0.6, ease: "easeInOut" }}
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "50%", background: accent }}
      />
      <motion.h1
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          color,
          fontSize: "clamp(1.6rem, 7vw, 2.6rem)",
          fontWeight: 700,
          margin: 0,
          position: "relative",
          zIndex: 1,
          overflowWrap: "break-word",
          textAlign: "center",
        }}
      >
        {name}
      </motion.h1>
    </div>
  );
}
