import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, clamp01, smoothstep } from "../00_shared/types";

export type CueCutHighlightSwipeProps = BaseEffectProps & {
  text: string;
  highlightOpacity?: number;
  angle?: number;
};

export function CueCutHighlightSwipe({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  text,
  highlightOpacity = 0.42,
  angle = -2,
}: CueCutHighlightSwipeProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = smoothstep(clamp01(progress));

  return (
    <span
      className={className}
      style={{
        position: "relative",
        display: "inline-block",
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        fontSize: 42,
        fontWeight: 850,
        padding: "2px 4px",
        zIndex: 0,
        ...style,
      }}
    >
      <span
        style={{
          position: "absolute",
          zIndex: -1,
          left: 0,
          top: "20%",
          width: `${p * 100}%`,
          height: "72%",
          borderRadius: 5,
          background: tokens.accent,
          opacity: highlightOpacity,
          transform: `rotate(${angle}deg)`,
          transformOrigin: "left center",
        }}
      />
      {text}
    </span>
  );
}
