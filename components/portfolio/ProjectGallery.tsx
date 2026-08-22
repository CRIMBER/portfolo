"use client";

import { useEffect, useRef, useState, type TouchEvent } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { PortfolioMedia } from "./PortfolioRenderer";
import { videoThumbnailUrl } from "@/lib/media";
import styles from "./renderer.module.css";

const SWIPE_THRESHOLD_PX = 50;

// A per-project thumbnail strip that opens into a full-screen
// lightbox — separate from ShowcaseReel (that's a whole-portfolio
// project-to-project reel; this is photos/clips *within* one project).
// Uses a fixed dark overlay regardless of theme, matching how every
// other photo viewer (OS-native, Instagram, etc.) works — a themed
// overlay would fight with the media itself for attention.
export function ProjectGallery({ media }: { media: PortfolioMedia[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const reducedMotion = useReducedMotion();
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (openIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenIndex(null);
      if (e.key === "ArrowRight") setOpenIndex((i) => (i === null ? i : (i + 1) % media.length));
      if (e.key === "ArrowLeft") setOpenIndex((i) => (i === null ? i : (i - 1 + media.length) % media.length));
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [openIndex, media.length]);

  function handleTouchStart(e: TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: TouchEvent) {
    const startX = touchStartX.current;
    touchStartX.current = null;
    if (startX === null) return;
    const deltaX = e.changedTouches[0].clientX - startX;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
    setOpenIndex((i) => {
      if (i === null) return i;
      return deltaX > 0 ? (i - 1 + media.length) % media.length : (i + 1) % media.length;
    });
  }

  if (media.length === 0) return null;
  const active = openIndex !== null ? media[openIndex] : null;

  return (
    <>
      <div className={styles.mediaStrip}>
        {media.map((item, i) => (
          <button
            type="button"
            key={item.id}
            className={styles.mediaStripItem}
            onClick={() => setOpenIndex(i)}
            aria-label={`Open ${item.type} ${i + 1} of ${media.length}`}
          >
            {item.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element -- member-uploaded content of unknown dimensions, not worth next/image's layout machinery here
              <img src={item.url} alt="" loading="lazy" />
            ) : (
              <video src={videoThumbnailUrl(item.url)} muted preload="metadata" />
            )}
            {item.type === "video" && <span className={styles.mediaPlayBadge}>▶</span>}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.25 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9997,
              background: "rgba(10,10,12,0.94)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}
            onClick={() => setOpenIndex(null)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpenIndex(null)}
              style={{
                position: "absolute",
                top: 8,
                right: 12,
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: "1.8rem",
                cursor: "pointer",
                lineHeight: 1,
                padding: 14,
                minWidth: 44,
                minHeight: 44,
              }}
            >
              ×
            </button>

            {media.length > 1 && (
              <button
                type="button"
                aria-label="Previous"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenIndex((i) => (i === null ? i : (i - 1 + media.length) % media.length));
                }}
                style={{
                  position: "absolute",
                  left: 4,
                  background: "none",
                  border: "none",
                  color: "#fff",
                  fontSize: "clamp(1.8rem, 6vw, 2.2rem)",
                  cursor: "pointer",
                  padding: 16,
                  minWidth: 44,
                  minHeight: 44,
                }}
              >
                ‹
              </button>
            )}

            <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", maxWidth: "90vw", maxHeight: "85vh" }}>
              {active.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element -- full-bleed lightbox view of member-uploaded content, arbitrary aspect ratio
                <img
                  src={active.url}
                  alt=""
                  style={{ maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain", borderRadius: 8, display: "block" }}
                />
              ) : (
                <video
                  key={active.id}
                  src={active.url}
                  controls
                  autoPlay
                  style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: 8 }}
                />
              )}
            </div>

            {media.length > 1 && (
              <button
                type="button"
                aria-label="Next"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenIndex((i) => (i === null ? i : (i + 1) % media.length));
                }}
                style={{
                  position: "absolute",
                  right: 4,
                  background: "none",
                  border: "none",
                  color: "#fff",
                  fontSize: "clamp(1.8rem, 6vw, 2.2rem)",
                  cursor: "pointer",
                  padding: 16,
                  minWidth: 44,
                  minHeight: 44,
                }}
              >
                ›
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
