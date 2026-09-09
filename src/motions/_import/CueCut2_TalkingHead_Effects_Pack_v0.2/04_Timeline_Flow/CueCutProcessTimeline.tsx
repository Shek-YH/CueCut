import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import {
  type BaseEffectProps,
  type CueCutTextItem,
  easeOutCubic,
  segmentProgress,
} from "../00_shared/types";

export type CueCutProcessTimelineProps = BaseEffectProps & {
  title?: string;
  items: CueCutTextItem[];
};

export function CueCutProcessTimeline({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  title = "Timeline",
  items,
}: CueCutProcessTimelineProps) {
  const tokens = getSkinTokens(skin, accentColor);

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width: 620,
        borderRadius: 24,
        padding: 24,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        ...style,
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 780, marginBottom: 18 }}>{title}</div>
      <div style={{ position: "relative", display: "grid", gap: 16 }}>
        <div style={{ position: "absolute", left: 17, top: 18, bottom: 18, width: 2, background: tokens.track }} />
        <div
          style={{
            position: "absolute",
            left: 17,
            top: 18,
            width: 2,
            height: `calc((100% - 36px) * ${Math.max(0, Math.min(1, progress))})`,
            background: tokens.accent,
          }}
        />
        {items.map((item, index) => {
          const p = easeOutCubic(segmentProgress(progress, index, items.length));
          return (
            <div key={item.id} style={{ display: "grid", gridTemplateColumns: "36px 1fr", gap: 14, position: "relative" }}>
              <div
                style={{
                  width: 18,
                  height: 18,
                  margin: "6px 0 0 8px",
                  borderRadius: 999,
                  background: p > 0.78 ? tokens.accent : tokens.track,
                  border: `3px solid ${p > 0.78 ? tokens.accent : tokens.muted}`,
                  boxShadow: p > 0.78 ? `0 0 16px ${tokens.accent}` : "none",
                }}
              />
              <div style={{ opacity: p, transform: `translateX(${(1 - p) * 14}px)` }}>
                <div style={{ fontSize: 17, fontWeight: 720 }}>{item.text}</div>
                {item.subtext ? (
                  <div style={{ marginTop: 4, color: tokens.muted, fontSize: 13 }}>{item.subtext}</div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
