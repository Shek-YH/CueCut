import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, easeOutCubic } from "../00_shared/types";

export type CueCutSpotlightBoxProps = BaseEffectProps & {
  label?: string;
  width?: number;
  height?: number;
  radius?: number;
  strokeWidth?: number;
};

export function CueCutSpotlightBox({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  label,
  width = 420,
  height = 240,
  radius = 20,
  strokeWidth = 5,
}: CueCutSpotlightBoxProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width,
        height,
        borderRadius: radius,
        border: `${strokeWidth}px solid ${tokens.accent}`,
        boxShadow: `0 0 ${20 + p * 30}px ${tokens.accent}55, inset 0 0 24px ${tokens.accent}20`,
        opacity: p,
        transform: `scale(${0.96 + p * 0.04})`,
        ...style,
      }}
    >
      {label ? (
        <div
          style={{
            position: "absolute",
            left: 14,
            top: -18,
            padding: "7px 10px",
            borderRadius: 999,
            background: tokens.accent,
            color: "#fff",
            fontFamily: "system-ui, sans-serif",
            fontSize: 12,
            fontWeight: 850,
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
}
