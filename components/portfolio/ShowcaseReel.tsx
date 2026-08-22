"use client";

import { useEffect, useRef, useState, type TouchEvent } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { entranceMotionProps } from "@/lib/canvas/animation-registry";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, PauseIcon, PlayIcon } from "@/components/icons";
import type { PortfolioProject } from "./PortfolioRenderer";
import styles from "./renderer.module.css";

const SWIPE_THRESHOLD_PX = 50;

interface ShowcaseReelProps {
  projects: PortfolioProject[];
  transitionPresetId: string;
  autoAdvanceMs: number;
  textColor: string;
  mutedColor: string;
  accentColor: string;
  backgroundColor: string;
}

// A visitor-triggered, full-screen project slideshow — separate from
// page load (see IntroOverlay) and from scrolling (see
// ScrollChoreography). Only rendered when the member has turned it on
// and there are at least two projects to cycle through.
export function ShowcaseReel({
  projects,
  transitionPresetId,
  autoAdvanceMs,
  textColor,
  mutedColor,
  accentColor,
  backgroundColor,
}: ShowcaseReelProps) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useReducedMotion();
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % projects.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + projects.length) % projects.length);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, projects.length]);

  function handleTouchStart(e: TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: TouchEvent) {
    const startX = touchStartX.current;
    touchStartX.current = null;
    if (startX === null) return;
    const deltaX = e.changedTouches[0].clientX - startX;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
    setIndex((i) => (deltaX > 0 ? (i - 1 + projects.length) % projects.length : (i + 1) % projects.length));
  }

  useEffect(() => {
    if (!open || paused || autoAdvanceMs <= 0) return;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % projects.length), autoAdvanceMs);
    return () => clearTimeout(timer);
  }, [open, paused, autoAdvanceMs, index, projects.length]);

  const project = projects[index];
  const motion1 = entranceMotionProps(transitionPresetId, 1);

  return (
    <>
      <button type="button" className={styles.reelTrigger} onClick={() => { setOpen(true); setIndex(0); setPaused(false); }}>
        <PlayIcon size={13} /> Watch reel
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9998,
              background: backgroundColor,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px 24px",
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close reel"
              style={{
                position: "absolute",
                top: 8,
                right: 12,
                background: "none",
                border: "none",
                boxShadow: "none",
                color: textColor,
                cursor: "pointer",
                padding: 14,
                minWidth: 44,
                minHeight: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CloseIcon size={22} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 24, width: "100%", maxWidth: 640 }}>
              <NavArrow direction="prev" color={textColor} onClick={() => setIndex((i) => (i - 1 + projects.length) % projects.length)} />

              <div style={{ flex: 1, minHeight: 240, position: "relative" }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={project.id}
                    initial={reducedMotion ? false : motion1.initial}
                    animate={motion1.animate}
                    exit={reducedMotion ? undefined : motion1.initial}
                    transition={motion1.transition}
                    style={{ textAlign: "center" }}
                  >
                    <h3 style={{ color: textColor, fontSize: "clamp(1.3rem, 5.5vw, 1.8rem)", margin: "0 0 8px", overflowWrap: "break-word" }}>
                      {project.title}
                    </h3>
                    {project.role && <p style={{ color: accentColor, margin: "0 0 12px" }}>{project.role}</p>}
                    {project.description && <p style={{ color: textColor, lineHeight: 1.6 }}>{project.description}</p>}
                    {project.technologies.length > 0 && (
                      <p style={{ color: mutedColor, fontSize: "0.85rem", marginTop: 12 }}>{project.technologies.join(" · ")}</p>
                    )}
                    <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 16 }}>
                      {project.demoUrl && (
                        <a href={project.demoUrl} target="_blank" rel="noreferrer noopener" style={{ color: accentColor }}>
                          Demo
                        </a>
                      )}
                      {project.githubUrl && (
                        <a href={project.githubUrl} target="_blank" rel="noreferrer noopener" style={{ color: accentColor }}>
                          Code
                        </a>
                      )}
                      {project.researchUrl && (
                        <a href={project.researchUrl} target="_blank" rel="noreferrer noopener" style={{ color: accentColor }}>
                          Write-up
                        </a>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <NavArrow direction="next" color={textColor} onClick={() => setIndex((i) => (i + 1) % projects.length)} />
            </div>

            <div style={{ display: "flex", marginTop: 24 }}>
              {projects.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => setIndex(i)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 12,
                    minWidth: 32,
                    minHeight: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: i === index ? accentColor : mutedColor,
                      opacity: i === index ? 1 : 0.4,
                    }}
                  />
                </button>
              ))}
            </div>

            {autoAdvanceMs > 0 && (
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                style={{
                  marginTop: 12,
                  background: "none",
                  border: "none",
                  boxShadow: "none",
                  color: mutedColor,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {paused ? <PlayIcon size={12} /> : <PauseIcon size={12} />}
                {paused ? "Resume" : "Pause"}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function NavArrow({ direction, color, onClick }: { direction: "prev" | "next"; color: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "prev" ? "Previous project" : "Next project"}
      style={{
        background: "none",
        border: "none",
        boxShadow: "none",
        color,
        cursor: "pointer",
        padding: 12,
        minWidth: 44,
        minHeight: 44,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {direction === "prev" ? <ChevronLeftIcon size={26} /> : <ChevronRightIcon size={26} />}
    </button>
  );
}
