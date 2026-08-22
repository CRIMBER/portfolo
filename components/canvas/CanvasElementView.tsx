"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import type { CSSProperties } from "react";
import type { CanvasElementData } from "@/lib/canvas/schema";
import { decodeWidget } from "@/lib/canvas/schema";
import { entranceMotionProps, hoverMotionProps } from "@/lib/canvas/animation-registry";
import { intensityScale } from "@/lib/theme/animation";
import { CanvasWidget } from "./CanvasWidget";

// Renders one freely-placed canvas element. The member's own
// placement (position/size/rotation) is a plain, static wrapper div;
// the inner motion.div only ever carries *animated* values from a
// bounded preset (see animation-registry.ts) — the two never fight,
// they compose (e.g. a "rotate-in" entrance settles into whatever
// static rotation the member set, rather than overwriting it).
export function CanvasElementView({ element }: { element: CanvasElementData }) {
  const reducedMotion = useReducedMotion();
  const entrance = element.animations.find((a) => a.trigger === "entrance");
  const scroll = element.animations.find((a) => a.trigger === "scroll");
  const hover = element.animations.find((a) => a.trigger === "hover");

  // Scroll-into-view takes priority over an on-mount entrance if both
  // are set on the same element — they'd otherwise fight over the
  // same "revealed" target state. Hover is a separate gesture and
  // always applies regardless of which of the two above is active.
  const reveal = scroll ?? entrance;
  const revealProps = reveal ? entranceMotionProps(reveal.presetId, intensityScale(reveal.intensity)) : null;
  const whileHover = hover ? hoverMotionProps(hover.presetId, intensityScale(hover.intensity)) : undefined;

  const wrapperStyle: CSSProperties = {
    position: "absolute",
    left: `${element.xPct}%`,
    top: element.yPx,
    width: `${element.widthPct}%`,
    height: element.heightPx,
    zIndex: element.zIndex,
    transform: `rotate(${element.rotationDeg}deg)`,
    transformOrigin: "center center",
  };

  const widgetPayload = element.type === "widget" ? decodeWidget(element.content) : null;

  const innerStyle: CSSProperties =
    element.type === "image"
      ? {
          width: "100%",
          height: "100%",
          position: "relative",
          borderRadius: element.imageStyle.borderRadiusPx,
          opacity: element.imageStyle.opacity,
          overflow: "hidden",
        }
      : {
          width: "100%",
          height: "100%",
          fontFamily: `"${element.textStyle.fontFamily}", system-ui, sans-serif`,
          fontSize: element.textStyle.fontSizePx,
          fontWeight: element.textStyle.fontWeight,
          color: element.textStyle.color,
          textAlign: element.textStyle.textAlign,
          whiteSpace: element.type === "text" ? "pre-wrap" : undefined,
          overflow: "hidden",
        };

  const motionProps = reducedMotion
    ? { initial: false as const }
    : scroll
      ? {
          initial: revealProps!.initial,
          whileInView: revealProps!.animate,
          viewport: { once: true, amount: 0.3 },
          transition: revealProps!.transition,
        }
      : entrance
        ? { initial: revealProps!.initial, animate: revealProps!.animate, transition: revealProps!.transition }
        : { initial: false as const };

  return (
    <div style={wrapperStyle}>
      <motion.div style={innerStyle} {...motionProps} whileHover={reducedMotion ? undefined : whileHover}>
        {element.type === "text" ? (
          element.content
        ) : element.type === "widget" ? (
          widgetPayload && (
            <CanvasWidget
              payload={widgetPayload}
              color={element.textStyle.color}
              fontFamily={element.textStyle.fontFamily}
              align={element.textStyle.textAlign}
            />
          )
        ) : (
          <Image src={element.content} alt="" fill sizes="50vw" style={{ objectFit: element.imageStyle.objectFit }} />
        )}
      </motion.div>
    </div>
  );
}
