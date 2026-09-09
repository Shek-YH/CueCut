import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, easeOutBack, easeOutCubic } from "../00_shared/types";

export type CueCutNamePlateProps = BaseEffectProps & {
  title: string;
  subtitle?: string;
  badge?: string;
};

export function CueCutNamePlate({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  title,
  subtitle,
  badge,
}: CueCutNamePlateProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);
  const pop = easeOutBack(progress);

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "stretch",
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        opacity: p,
        transform: `scale(${0.9 + pop * 0.1})`,
        ...style,
      }}
    >
      {badge ? (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: "14px 0 0 14px",
            background: tokens.accent,
            color: "#fff",
            display: "grid",
            placeItems: "center",
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 1,
          }}
        >
          {badge}
        </div>
      ) : null}
      <div
        style={{
          ...tokens.panel,
          borderRadius: badge ? "0 14px 14px 0" : 14,
          padding: "10px 14px",
          minWidth: 260,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 900 }}>{title}</div>
        {subtitle ? <div style={{ marginTop: 2, color: tokens.muted, fontSize: 11 }}>{subtitle}</div> : null}
      </div>
    </div>
  );
}
