"use client";

import { useEffect, useRef, useState } from "react";
import { PauseIcon, PlayIcon } from "@/components/icons";
import styles from "./renderer.module.css";

interface BackgroundMusicProps {
  url: string;
  volume: number;
  autoplay: boolean;
}

// A member-uploaded background track for their public page — mounted
// only on the real public page (never the dashboard's live preview,
// see PortfolioRenderer) and only when a track is set. Autoplay is
// attempted but not guaranteed: browsers block unmuted autoplay
// without prior user interaction, so a rejected play() falls back to
// a paused state and the toggle button lets the visitor start it
// themselves — a hard browser constraint, not a design choice.
export function BackgroundMusic({ url, volume, autoplay }: BackgroundMusicProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [paused, setPaused] = useState(!autoplay);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !autoplay) return;
    audio
      .play()
      .then(() => setPaused(false))
      .catch(() => setPaused(true));
  }, [autoplay, url]);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
      setPaused(false);
    } else {
      audio.pause();
      setPaused(true);
    }
  }

  return (
    <>
      <audio ref={audioRef} src={url} loop />
      <button
        type="button"
        className={styles.musicToggle}
        onClick={toggle}
        aria-label={paused ? "Play background music" : "Pause background music"}
      >
        {paused ? <PlayIcon size={16} /> : <PauseIcon size={16} />}
      </button>
    </>
  );
}
