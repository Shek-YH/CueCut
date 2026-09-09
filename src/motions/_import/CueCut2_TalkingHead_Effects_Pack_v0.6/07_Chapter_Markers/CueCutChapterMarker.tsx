import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, easeOutCubic } from "../00_shared/types";

export type CueCutChapterMarkerProps = BaseEffectProps & {
  index?: number;
  title: string;
  subtitle?: string;
};

export function CueCutChapterMarker({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  index,
  title,
  subtitle,
}: CueCutChapterMarkerProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width: 720,
        borderRadius: 28,
        padding: 28,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        opacity: p,
        transform: `translateY(${(1 - p) * 22}px)`,
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {index !== undefined ? (
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              display: "grid",
              placeItems: "center",
              background: tokens.accent,
              color: "#fff",
              fontSize: 17,
              fontWeight: 900,
            }}
          >
            {String(index).padStart(2, "0")}
          </div>
        ) : null}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 30, fontWeight: 950, letterSpacing: "-0.03em" }}>{title}</div>
          {subtitle ? <div style={{ marginTop: 5, color: tokens.muted, fontSize: 14 }}>{subtitle}</div> : null}
        </div>
      </div>
      <div style={{ marginTop: 20, width: `${p * 100}%`, height: 4, borderRadius: 999, background: tokens.accent }} />
    </div>
  );
}
