import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, easeOutBack, easeOutCubic } from "../00_shared/types";

export type CueCutReactionBadgeProps = BaseEffectProps & {
  emoji?: string;
  text: string;
  count?: string | number;
};

export function CueCutReactionBadge({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  emoji = "🔥",
  text,
  count,
}: CueCutReactionBadgeProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);
  const pop = easeOutBack(progress);

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        borderRadius: 999,
        padding: "9px 14px",
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        opacity: p,
        transform: `scale(${0.75 + pop * 0.25})`,
        ...style,
      }}
    >
      <span style={{ fontSize: 24 }}>{emoji}</span>
      <span style={{ fontSize: 15, fontWeight: 850 }}>{text}</span>
      {count !== undefined ? (
        <span
          style={{
            minWidth: 28,
            height: 28,
            padding: "0 8px",
            borderRadius: 999,
            display: "grid",
            placeItems: "center",
            background: tokens.accent,
            color: "#fff",
            fontSize: 12,
            fontWeight: 900,
          }}
        >
          {count}
        </span>
      ) : null}
    </div>
  );
}
