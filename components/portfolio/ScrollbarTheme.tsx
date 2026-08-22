"use client";

import { useEffect } from "react";

// Themes the actual browser scrollbar on the public portfolio page.
// Sets custom properties on <html> (not just the renderer's own
// subtree) via style.setProperty — safe against injection since it's
// a property assignment, not string-interpolated CSS — and cleans up
// on unmount so navigating to app-chrome pages doesn't leave a
// member's colors behind.
export function ScrollbarTheme({ thumb, track }: { thumb: string; track: string }) {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--tc-scrollbar-thumb", thumb);
    root.style.setProperty("--tc-scrollbar-track", track);
    return () => {
      root.style.removeProperty("--tc-scrollbar-thumb");
      root.style.removeProperty("--tc-scrollbar-track");
    };
  }, [thumb, track]);

  return null;
}
