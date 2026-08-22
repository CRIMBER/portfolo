"use client";

import { useEffect, useRef, useState } from "react";
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

    const key = `intro-seen:${handle}`;
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
