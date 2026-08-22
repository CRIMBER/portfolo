"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import type { MarqueeWidgetData, SkillBarsWidgetData, StatWidgetData, StatusWidgetData, WidgetPayload } from "@/lib/canvas/schema";
import styles from "./widgets.module.css";

interface VisualProps {
  color: string;
  fontFamily: string;
  align: "left" | "center" | "right";
}

// Dispatches on WidgetKind to the concrete visual — the one place that
// interprets a decoded WidgetPayload as pixels. See lib/canvas/schema.ts
// for why a widget is a "text" element under the hood.
export function CanvasWidget({ payload, color, fontFamily, align }: { payload: WidgetPayload } & VisualProps) {
  switch (payload.kind) {
    case "stat":
      return <StatWidget data={payload.data} color={color} fontFamily={fontFamily} align={align} />;
    case "skillbars":
      return <SkillBarsWidget data={payload.data} color={color} fontFamily={fontFamily} align={align} />;
    case "status":
      return <StatusWidget data={payload.data} color={color} fontFamily={fontFamily} align={align} />;
    case "marquee":
      return <MarqueeWidget data={payload.data} color={color} fontFamily={fontFamily} />;
  }
}

const ALIGN_ITEMS: Record<VisualProps["align"], string> = { left: "flex-start", center: "center", right: "flex-end" };

function StatWidget({ data, color, fontFamily, align }: { data: StatWidgetData } & VisualProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      // Skipping straight to the settled value once scrolled into view
      // (rather than animating) is the whole point of the
      // reduced-motion branch — there's no external system to
      // subscribe to here, just a one-time snap once inView flips.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplay(data.value);
      return;
    }
    const controls = animate(0, data.value, {
      duration: 1.3,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, reduced, data.value]);

  return (
    <div
      ref={ref}
      className={styles.stat}
      style={{ color, fontFamily, textAlign: align, alignItems: ALIGN_ITEMS[align] }}
    >
      <span className={styles.statValue}>
        {display}
        {data.suffix}
      </span>
      <span className={styles.statLabel}>{data.label}</span>
    </div>
  );
}

function SkillBarsWidget({ data, color, fontFamily, align }: { data: SkillBarsWidgetData } & VisualProps) {
  const reduced = useReducedMotion();
  return (
    <div className={styles.skillbars} style={{ fontFamily, textAlign: align, color }}>
      {data.skills.map((skill, i) => (
        <div className={styles.skillRow} key={`${skill.label}-${i}`}>
          <div className={styles.skillLabelRow}>
            <span>{skill.label}</span>
            <span>{skill.pct}%</span>
          </div>
          <div className={styles.skillTrack}>
            <motion.div
              className={styles.skillFill}
              style={{ background: color }}
              initial={{ width: reduced ? `${skill.pct}%` : "0%" }}
              whileInView={{ width: `${skill.pct}%` }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: reduced ? 0 : 0.9, ease: "easeOut", delay: reduced ? 0 : i * 0.08 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const STATUS_DOT_COLOR: Record<StatusWidgetData["state"], string> = {
  available: "#2fd66b",
  busy: "#f5a524",
  away: "#8b8b96",
};

function StatusWidget({ data, color, fontFamily, align }: { data: StatusWidgetData } & VisualProps) {
  const dotColor = STATUS_DOT_COLOR[data.state];
  return (
    <div className={styles.statusWrap} style={{ justifyContent: ALIGN_ITEMS[align] }}>
      <span className={styles.statusPill} style={{ color, fontFamily }}>
        <span className={styles.statusDot} style={{ background: dotColor, "--dot-color": dotColor } as CSSProperties} />
        {data.label}
      </span>
    </div>
  );
}

const MARQUEE_DURATION: Record<MarqueeWidgetData["speed"], string> = { slow: "22s", medium: "14s", fast: "8s" };

function MarqueeWidget({ data, color, fontFamily }: { data: MarqueeWidgetData } & Pick<VisualProps, "color" | "fontFamily">) {
  const reduced = useReducedMotion();
  if (reduced) {
    return (
      <div className={styles.marqueeStatic} style={{ color, fontFamily }}>
        {data.text}
      </div>
    );
  }
  return (
    <div className={styles.marqueeWrap}>
      <div
        className={styles.marqueeTrack}
        style={{ color, fontFamily, animationDuration: MARQUEE_DURATION[data.speed] }}
      >
        <span className={styles.marqueeItem}>{data.text}</span>
        <span className={styles.marqueeItem} aria-hidden="true">
          {data.text}
        </span>
      </div>
    </div>
  );
}
