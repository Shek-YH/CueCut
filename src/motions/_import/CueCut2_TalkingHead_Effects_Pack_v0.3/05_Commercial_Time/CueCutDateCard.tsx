import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, easeOutCubic } from "../00_shared/types";

export type CueCutDateCardProps = BaseEffectProps & {
  month: string;
  day: string | number;
  year?: string | number;
  label?: string;
  weekday?: string;
};

export function CueCutDateCard({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  month,
  day,
  year,
  label,
  weekday,
}: CueCutDateCardProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width: 410,
        borderRadius: 28,
        overflow: "hidden",
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        opacity: p,
        transform: `translateY(${(1 - p) * 16}px)`,
        ...style,
      }}
    >
      <div
        style={{
          background: tokens.accent,
          color: "#fff",
          padding: "12px 20px",
          textAlign: "center",
          fontSize: 16,
          fontWeight: 850,
          letterSpacing: 1.4,
        }}
      >
        {month.toUpperCase()}
      </div>
      <div style={{ padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 76, lineHeight: 0.95, fontWeight: 950 }}>{day}</div>
        <div style={{ marginTop: 9, color: tokens.muted, fontSize: 14 }}>
          {[weekday, year].filter(Boolean).join(" · ")}
        </div>
        {label ? (
          <div style={{ marginTop: 16, fontSize: 16, fontWeight: 720 }}>{label}</div>
        ) : null}
      </div>
    </div>
  );
}
