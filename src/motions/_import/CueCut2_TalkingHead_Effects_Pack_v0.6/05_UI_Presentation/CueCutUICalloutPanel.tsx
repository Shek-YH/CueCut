import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, easeOutCubic } from "../00_shared/types";

export type CueCutUICalloutPanelProps = BaseEffectProps & {
  title: string;
  description?: string;
  code?: string;
  side?: "left" | "right";
};

export function CueCutUICalloutPanel({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  title,
  description,
  code,
  side = "right",
}: CueCutUICalloutPanelProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);
  const right = side === "right";

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width: 420,
        borderRadius: 22,
        padding: 20,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        opacity: p,
        transform: `translateX(${(1 - p) * (right ? 24 : -24)}px)`,
        ...style,
      }}
    >
      <div style={{ color: tokens.accent, fontSize: 12, fontWeight: 850, letterSpacing: 1.1 }}>UI CALLOUT</div>
      <div style={{ marginTop: 7, fontSize: 21, fontWeight: 850 }}>{title}</div>
      {description ? <div style={{ marginTop: 7, fontSize: 13, lineHeight: 1.45, color: tokens.muted }}>{description}</div> : null}
      {code ? (
        <div
          style={{
            marginTop: 13,
            borderRadius: 12,
            padding: "10px 12px",
            background: tokens.codeBg,
            color: tokens.accent,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 12,
          }}
        >
          {code}
        </div>
      ) : null}
    </div>
  );
}
