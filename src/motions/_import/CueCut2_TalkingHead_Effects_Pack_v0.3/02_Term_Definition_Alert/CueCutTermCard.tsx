import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, easeOutCubic } from "../00_shared/types";

export type CueCutTermCardProps = BaseEffectProps & {
  term: string;
  expansion?: string;
  definition?: string;
  tag?: string;
};

export function CueCutTermCard({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  term,
  expansion,
  definition,
  tag = "TERM",
}: CueCutTermCardProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width: 600,
        borderRadius: 26,
        padding: 26,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        opacity: p,
        transform: `translateX(${(1 - p) * -20}px)`,
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            background: tokens.track,
            color: tokens.accent,
            fontSize: 11,
            letterSpacing: 1.3,
            fontWeight: 850,
          }}
        >
          {tag}
        </span>
        <div
          style={{
            width: 46 * p,
            height: 3,
            borderRadius: 999,
            background: tokens.accent,
          }}
        />
      </div>

      <div style={{ marginTop: 18, fontSize: 42, fontWeight: 900, letterSpacing: "-0.04em" }}>
        {term}
      </div>
      {expansion ? (
        <div style={{ marginTop: 4, fontSize: 16, color: tokens.accent, fontWeight: 720 }}>
          {expansion}
        </div>
      ) : null}
      {definition ? (
        <div style={{ marginTop: 14, fontSize: 17, lineHeight: 1.55, color: tokens.muted }}>
          {definition}
        </div>
      ) : null}
    </div>
  );
}
