import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, easeOutCubic, pulse } from "../00_shared/types";

export type CueCutBadgePulseProps = BaseEffectProps & {
  text: string;
  dot?: boolean;
  tone?: "accent" | "positive" | "negative" | "warning";
};

export function CueCutBadgePulse({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  text,
  dot = true,
  tone = "accent",
}: CueCutBadgePulseProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);
  const ring = pulse(progress, 1);
  const color =
    tone === "positive" ? tokens.positive :
    tone === "negative" ? tokens.negative :
    tone === "warning" ? tokens.warning :
    tokens.accent;

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        borderRadius: 999,
        padding: "8px 12px",
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
        fontWeight: 850,
        opacity: p,
        ...style,
      }}
    >
      {dot ? (
        <span
          style={{
            position: "relative",
            width: 9,
            height: 9,
            borderRadius: 999,
            background: color,
            boxShadow: `0 0 ${8 + ring * 12}px ${color}`,
          }}
        />
      ) : null}
      {text}
    </div>
  );
}
