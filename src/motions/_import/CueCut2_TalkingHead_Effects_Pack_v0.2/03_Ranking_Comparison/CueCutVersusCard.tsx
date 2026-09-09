import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, clamp01, easeOutCubic } from "../00_shared/types";

export type VersusSide = {
  title: string;
  subtitle?: string;
  score?: number;
  badge?: string;
};

export type CueCutVersusCardProps = BaseEffectProps & {
  left: VersusSide;
  right: VersusSide;
  headline?: string;
};

export function CueCutVersusCard({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  left,
  right,
  headline = "Comparison",
}: CueCutVersusCardProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(clamp01(progress));
  const leftP = Math.min(1, p * 1.25);
  const rightP = Math.max(0, Math.min(1, (p - 0.15) * 1.35));

  const side = (item: VersusSide, amount: number, align: "left" | "right") => (
    <div
      style={{
        flex: 1,
        minHeight: 190,
        borderRadius: 20,
        padding: 22,
        background: "rgba(255,255,255,0.055)",
        opacity: amount,
        transform: `translateX(${(1 - amount) * (align === "left" ? -24 : 24)}px)`,
        textAlign: align,
      }}
    >
      {item.badge ? (
        <div style={{ color: tokens.accent, fontSize: 12, fontWeight: 800, letterSpacing: 0.8 }}>
          {item.badge}
        </div>
      ) : null}
      <div style={{ fontSize: 27, fontWeight: 850, marginTop: 8 }}>{item.title}</div>
      {item.subtitle ? (
        <div style={{ fontSize: 14, color: tokens.muted, marginTop: 6 }}>{item.subtitle}</div>
      ) : null}
      {typeof item.score === "number" ? (
        <div style={{ fontSize: 48, fontWeight: 900, marginTop: 18 }}>
          {(item.score * amount).toFixed(item.score % 1 === 0 ? 0 : 1)}
        </div>
      ) : null}
    </div>
  );

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width: 760,
        borderRadius: 28,
        padding: 24,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        ...style,
      }}
    >
      <div style={{ textAlign: "center", fontSize: 20, fontWeight: 760, marginBottom: 18 }}>{headline}</div>
      <div style={{ display: "flex", alignItems: "stretch", gap: 16, position: "relative" }}>
        {side(left, leftP, "left")}
        <div
          style={{
            alignSelf: "center",
            width: 54,
            height: 54,
            borderRadius: 999,
            display: "grid",
            placeItems: "center",
            flex: "0 0 auto",
            fontWeight: 900,
            background: tokens.accent,
            color: "#fff",
            transform: `scale(${0.7 + p * 0.3})`,
            opacity: p,
          }}
        >
          VS
        </div>
        {side(right, rightP, "right")}
      </div>
    </div>
  );
}
