import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { Sparkle } from "../00_shared/Sparkle";
import { type BaseEffectProps, easeOutBack, easeOutCubic } from "../00_shared/types";

export type CueCutKeyPointProps = BaseEffectProps & {
  eyebrow?: string;
  text: string;
  highlight?: string;
};

export function CueCutKeyPoint({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  eyebrow = "KEY POINT",
  text,
  highlight,
}: CueCutKeyPointProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);
  const pop = easeOutBack(progress);
  const parts = highlight ? text.split(highlight) : [text];

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width: 720,
        borderRadius: 30,
        padding: "28px 32px 32px",
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        opacity: p,
        transform: `scale(${0.92 + pop * 0.08})`,
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9, color: tokens.accent }}>
        <Sparkle size={19} color={tokens.accent} opacity={p} />
        <span style={{ fontSize: 13, fontWeight: 850, letterSpacing: 1.4 }}>{eyebrow}</span>
      </div>

      <div
        style={{
          marginTop: 17,
          fontSize: 40,
          lineHeight: 1.24,
          fontWeight: 900,
          letterSpacing: "-0.035em",
        }}
      >
        {highlight && parts.length > 1 ? (
          <>
            {parts[0]}
            <span
              style={{
                color: tokens.accent,
                position: "relative",
                display: "inline-block",
                transform: `translateY(${(1 - p) * 6}px)`,
              }}
            >
              {highlight}
            </span>
            {parts.slice(1).join(highlight)}
          </>
        ) : (
          text
        )}
      </div>
    </div>
  );
}
