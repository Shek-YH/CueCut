import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, clamp01 } from "../00_shared/types";

export type CueCutCircleFocusProps = BaseEffectProps & {
  text: string;
  paddingX?: number;
  paddingY?: number;
  strokeWidth?: number;
};

export function CueCutCircleFocus({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  text,
  paddingX = 16,
  paddingY = 8,
  strokeWidth = 4,
}: CueCutCircleFocusProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = clamp01(progress);

  return (
    <span
      className={className}
      style={{
        position: "relative",
        display: "inline-block",
        padding: `${paddingY}px ${paddingX}px`,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        fontSize: 42,
        fontWeight: 850,
        ...style,
      }}
    >
      {text}
      <svg
        viewBox="0 0 220 90"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          inset: "-8px -10px",
          width: "calc(100% + 20px)",
          height: "calc(100% + 16px)",
          pointerEvents: "none",
        }}
      >
        <ellipse
          cx="110"
          cy="45"
          rx="103"
          ry="36"
          fill="none"
          stroke={tokens.accent}
          strokeWidth={strokeWidth}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - p}
          strokeLinecap="round"
          transform="rotate(-2 110 45)"
        />
      </svg>
    </span>
  );
}
