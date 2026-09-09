import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, easeOutBack, easeOutCubic } from "../00_shared/types";

export type CueCutToolCardProps = BaseEffectProps & {
  name: string;
  description?: string;
  iconSrc?: string;
  category?: string;
  metricLabel?: string;
  metricValue?: string;
};

export function CueCutToolCard({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  name,
  description,
  iconSrc,
  category = "AI TOOL",
  metricLabel,
  metricValue,
}: CueCutToolCardProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);
  const pop = easeOutBack(progress);

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width: 620,
        borderRadius: 28,
        padding: 24,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        opacity: p,
        transform: `scale(${0.94 + pop * 0.06})`,
        ...style,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "72px 1fr auto", gap: 16, alignItems: "center" }}>
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: 18,
            display: "grid",
            placeItems: "center",
            background: tokens.track,
            overflow: "hidden",
            fontSize: 30,
            fontWeight: 900,
          }}
        >
          {iconSrc ? (
            <img src={iconSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            name.slice(0, 1).toUpperCase()
          )}
        </div>

        <div>
          <div style={{ fontSize: 11, color: tokens.accent, fontWeight: 850, letterSpacing: 1.2 }}>
            {category}
          </div>
          <div style={{ marginTop: 4, fontSize: 29, fontWeight: 900 }}>{name}</div>
          {description ? (
            <div style={{ marginTop: 5, color: tokens.muted, fontSize: 14, lineHeight: 1.4 }}>
              {description}
            </div>
          ) : null}
        </div>

        {metricValue ? (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: tokens.accent }}>{metricValue}</div>
            {metricLabel ? (
              <div style={{ marginTop: 2, color: tokens.muted, fontSize: 11 }}>{metricLabel}</div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
