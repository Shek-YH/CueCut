import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, clamp01 } from "../00_shared/types";

export type CueCutPointerArrowProps = BaseEffectProps & {
  label?: string;
  direction?: "right" | "left" | "down" | "up";
  length?: number;
};

export function CueCutPointerArrow({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  label,
  direction = "right",
  length = 180,
}: CueCutPointerArrowProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = clamp01(progress);
  const horizontal = direction === "left" || direction === "right";
  const reverse = direction === "left" || direction === "up";

  const w = horizontal ? length : 64;
  const h = horizontal ? 64 : length;

  let d = horizontal
    ? `M ${reverse ? length - 8 : 8} 32 H ${reverse ? 26 : length - 26}
       M ${reverse ? 26 : length - 26} 32 L ${reverse ? 42 : length - 42} 18
       M ${reverse ? 26 : length - 26} 32 L ${reverse ? 42 : length - 42} 46`
    : `M 32 ${reverse ? length - 8 : 8} V ${reverse ? 26 : length - 26}
       M 32 ${reverse ? 26 : length - 26} L 18 ${reverse ? 42 : length - 42}
       M 32 ${reverse ? 26 : length - 26} L 46 ${reverse ? 42 : length - 42}`;

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        flexDirection: horizontal ? "column" : "row",
        gap: 4,
        alignItems: "center",
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        ...style,
      }}
    >
      {label ? (
        <div style={{ color: tokens.accent, fontSize: 13, fontWeight: 850 }}>{label}</div>
      ) : null}
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
        <path
          d={d}
          fill="none"
          stroke={tokens.accent}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - p}
        />
      </svg>
    </div>
  );
}
