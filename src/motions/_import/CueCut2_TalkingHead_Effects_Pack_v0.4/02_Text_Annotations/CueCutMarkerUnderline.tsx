import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, clamp01 } from "../00_shared/types";

export type CueCutMarkerUnderlineProps = BaseEffectProps & {
  text: string;
  strokeWidth?: number;
  roughness?: number;
};

export function CueCutMarkerUnderline({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  text,
  strokeWidth = 8,
  roughness = 5,
}: CueCutMarkerUnderlineProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = clamp01(progress);
  const d = `M 4 39 C 52 ${39 + roughness}, 138 ${39 - roughness}, 204 40
             C 260 ${40 + roughness * 0.6}, 330 ${40 - roughness * 0.8}, 396 39`;

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
        paddingBottom: 12,
        ...style,
      }}
    >
      {text}
      <svg
        viewBox="0 0 400 50"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: 20,
          overflow: "visible",
          pointerEvents: "none",
        }}
      >
        <path
          d={d}
          fill="none"
          stroke={tokens.accent}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - p}
          opacity={0.82}
        />
      </svg>
    </span>
  );
}
