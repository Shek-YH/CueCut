import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, easeOutBack, easeOutCubic } from "../00_shared/types";

export type CueCutPriceCardProps = BaseEffectProps & {
  title?: string;
  price: string;
  oldPrice?: string;
  period?: string;
  badge?: string;
  note?: string;
};

export function CueCutPriceCard({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  title = "Price",
  price,
  oldPrice,
  period,
  badge,
  note,
}: CueCutPriceCardProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);
  const pop = easeOutBack(progress);

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width: 520,
        borderRadius: 28,
        padding: 28,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        textAlign: "center",
        opacity: p,
        transform: `scale(${0.9 + pop * 0.1})`,
        ...style,
      }}
    >
      {badge ? (
        <div
          style={{
            display: "inline-block",
            padding: "6px 11px",
            borderRadius: 999,
            background: tokens.accent,
            color: "#fff",
            fontSize: 11,
            fontWeight: 850,
          }}
        >
          {badge}
        </div>
      ) : null}
      <div style={{ marginTop: badge ? 13 : 0, fontSize: 15, color: tokens.muted, fontWeight: 720 }}>
        {title}
      </div>
      <div style={{ marginTop: 9, fontSize: 58, lineHeight: 1, fontWeight: 950, letterSpacing: "-0.05em" }}>
        {price}
        {period ? <span style={{ fontSize: 18, color: tokens.muted, marginLeft: 6 }}>{period}</span> : null}
      </div>
      {oldPrice ? (
        <div style={{ marginTop: 10, color: tokens.muted, fontSize: 18, textDecoration: "line-through" }}>
          {oldPrice}
        </div>
      ) : null}
      {note ? (
        <div style={{ marginTop: 14, color: tokens.accent, fontSize: 13, fontWeight: 720 }}>{note}</div>
      ) : null}
    </div>
  );
}
