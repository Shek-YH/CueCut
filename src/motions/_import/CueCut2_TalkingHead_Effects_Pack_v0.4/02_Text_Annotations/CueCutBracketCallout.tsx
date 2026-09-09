import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, clamp01 } from "../00_shared/types";

export type CueCutBracketCalloutProps = BaseEffectProps & {
  text: string;
  side?: "left" | "right";
  label?: string;
};

export function CueCutBracketCallout({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  text,
  side = "left",
  label,
}: CueCutBracketCalloutProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = clamp01(progress);
  const left = side === "left";

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: left ? "row" : "row-reverse",
        gap: 14,
        alignItems: "stretch",
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        ...style,
      }}
    >
      <svg width="28" height="110" viewBox="0 0 28 110" style={{ overflow: "visible" }}>
        <path
          d={left ? "M24 4 H9 V106 H24" : "M4 4 H19 V106 H4"}
          fill="none"
          stroke={tokens.accent}
          strokeWidth="4"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - p}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div style={{ padding: "10px 0" }}>
        {label ? (
          <div style={{ fontSize: 11, color: tokens.accent, fontWeight: 850, letterSpacing: 1.2 }}>
            {label}
          </div>
        ) : null}
        <div style={{ marginTop: label ? 6 : 0, fontSize: 25, lineHeight: 1.4, fontWeight: 800 }}>
          {text}
        </div>
      </div>
    </div>
  );
}
