import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, easeOutCubic } from "../00_shared/types";

export type CueCutQuoteCardProps = BaseEffectProps & {
  quote: string;
  author?: string;
  source?: string;
  mark?: "quote" | "line";
};

export function CueCutQuoteCard({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  quote,
  author,
  source,
  mark = "quote",
}: CueCutQuoteCardProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width: 680,
        borderRadius: 28,
        padding: 30,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        opacity: p,
        transform: `translateY(${(1 - p) * 18}px) scale(${0.98 + p * 0.02})`,
        ...style,
      }}
    >
      {mark === "quote" ? (
        <div style={{ color: tokens.accent, fontSize: 64, lineHeight: 0.7, fontWeight: 900 }}>
          “
        </div>
      ) : (
        <div style={{ width: 58 * p, height: 4, borderRadius: 999, background: tokens.accent }} />
      )}

      <div
        style={{
          marginTop: mark === "quote" ? 8 : 20,
          fontSize: 30,
          lineHeight: 1.42,
          fontWeight: 760,
          letterSpacing: "-0.02em",
        }}
      >
        {quote}
      </div>

      {(author || source) ? (
        <div style={{ marginTop: 22, display: "flex", gap: 10, color: tokens.muted, fontSize: 14 }}>
          {author ? <strong style={{ color: tokens.text }}>{author}</strong> : null}
          {source ? <span>· {source}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
