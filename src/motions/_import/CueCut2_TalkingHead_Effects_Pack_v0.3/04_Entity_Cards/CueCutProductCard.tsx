import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, easeOutCubic } from "../00_shared/types";

export type CueCutProductCardProps = BaseEffectProps & {
  name: string;
  tagline?: string;
  imageSrc?: string;
  badge?: string;
  footer?: string;
};

export function CueCutProductCard({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  name,
  tagline,
  imageSrc,
  badge,
  footer,
}: CueCutProductCardProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width: 660,
        borderRadius: 28,
        padding: 18,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        opacity: p,
        transform: `translateY(${(1 - p) * 18}px)`,
        ...style,
      }}
    >
      <div
        style={{
          height: 260,
          borderRadius: 20,
          overflow: "hidden",
          background: `linear-gradient(135deg, ${tokens.track}, rgba(255,255,255,0.03))`,
          position: "relative",
          display: "grid",
          placeItems: "center",
        }}
      >
        {imageSrc ? (
          <img src={imageSrc} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ fontSize: 72, fontWeight: 950, color: tokens.accent }}>{name.slice(0, 1)}</div>
        )}
        {badge ? (
          <div
            style={{
              position: "absolute",
              top: 14,
              left: 14,
              padding: "7px 10px",
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
      </div>

      <div style={{ padding: "18px 8px 6px" }}>
        <div style={{ fontSize: 30, fontWeight: 900 }}>{name}</div>
        {tagline ? (
          <div style={{ marginTop: 6, color: tokens.muted, fontSize: 15, lineHeight: 1.45 }}>
            {tagline}
          </div>
        ) : null}
        {footer ? (
          <div style={{ marginTop: 14, color: tokens.accent, fontSize: 13, fontWeight: 760 }}>
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
