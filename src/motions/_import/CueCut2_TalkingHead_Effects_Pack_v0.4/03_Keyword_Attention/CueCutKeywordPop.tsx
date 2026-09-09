import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, easeOutBack, easeOutCubic } from "../00_shared/types";

export type CueCutKeywordPopProps = BaseEffectProps & {
  text: string;
  label?: string;
  rotateDeg?: number;
};

export function CueCutKeywordPop({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  text,
  label,
  rotateDeg = -2,
}: CueCutKeywordPopProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);
  const pop = easeOutBack(progress);

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        opacity: p,
        transform: `scale(${0.56 + pop * 0.44}) rotate(${(1 - p) * rotateDeg}deg)`,
        ...style,
      }}
    >
      {label ? (
        <div style={{ fontSize: 12, color: tokens.muted, fontWeight: 800, marginBottom: 6 }}>
          {label}
        </div>
      ) : null}
      <div
        style={{
          background: tokens.accent,
          color: "#fff",
          borderRadius: 18,
          padding: "10px 18px",
          fontSize: 42,
          lineHeight: 1.08,
          fontWeight: 950,
          letterSpacing: "-0.04em",
          boxShadow: `0 14px 40px ${tokens.accent}33`,
        }}
      >
        {text}
      </div>
    </div>
  );
}
