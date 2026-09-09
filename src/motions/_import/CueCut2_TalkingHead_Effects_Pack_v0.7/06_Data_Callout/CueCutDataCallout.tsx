import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, easeOutBack, easeOutCubic } from "../00_shared/types";

export type CueCutDataCalloutProps = BaseEffectProps & {
  value: string;
  label: string;
  note?: string;
  tone?: "accent" | "positive" | "negative" | "warning";
};

export function CueCutDataCallout({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  value,
  label,
  note,
  tone = "accent",
}: CueCutDataCalloutProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);
  const pop = easeOutBack(progress);
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
        width: 400,
        borderRadius: 24,
        padding: 22,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        borderTop: `5px solid ${color}`,
        opacity: p,
        transform: `scale(${0.9 + pop * 0.1})`,
        ...style,
      }}
    >
      <div style={{ color: tokens.muted, fontSize: 12, fontWeight: 760 }}>{label}</div>
      <div style={{ marginTop: 6, fontSize: 46, fontWeight: 950, color, letterSpacing: "-0.04em" }}>{value}</div>
      {note ? <div style={{ marginTop: 8, fontSize: 12, color: tokens.muted, lineHeight: 1.4 }}>{note}</div> : null}
    </div>
  );
}
