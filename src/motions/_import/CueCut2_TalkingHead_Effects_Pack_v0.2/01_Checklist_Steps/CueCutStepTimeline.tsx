import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import {
  type BaseEffectProps,
  type CueCutTextItem,
  easeOutCubic,
  segmentProgress,
} from "../00_shared/types";

export type CueCutStepTimelineProps = BaseEffectProps & {
  title?: string;
  items: CueCutTextItem[];
  orientation?: "vertical" | "horizontal";
};

export function CueCutStepTimeline({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  title = "Steps",
  items,
  orientation = "vertical",
}: CueCutStepTimelineProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const vertical = orientation === "vertical";

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width: vertical ? 560 : 820,
        borderRadius: 24,
        padding: 24,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        ...style,
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 760, marginBottom: 20 }}>{title}</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: vertical ? "1fr" : `repeat(${items.length}, minmax(0, 1fr))`,
          gap: vertical ? 14 : 10,
        }}
      >
        {items.map((item, index) => {
          const p = easeOutCubic(segmentProgress(progress, index, items.length));
          return (
            <div
              key={item.id}
              style={{
                display: "grid",
                gridTemplateColumns: vertical ? "46px 1fr" : "1fr",
                gap: vertical ? 12 : 8,
                alignItems: "start",
                opacity: p,
                transform: `translate${vertical ? "X" : "Y"}(${(1 - p) * 18}px)`,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 999,
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 800,
                  color: p > 0.85 ? "#fff" : tokens.accent,
                  background: p > 0.85 ? tokens.accent : "transparent",
                  border: `2px solid ${tokens.accent}`,
                  margin: vertical ? 0 : "0 auto",
                }}
              >
                {index + 1}
              </div>
              <div style={{ textAlign: vertical ? "left" : "center" }}>
                <div style={{ fontSize: 17, fontWeight: 700 }}>{item.text}</div>
                {item.subtext ? (
                  <div style={{ marginTop: 4, fontSize: 13, color: tokens.muted }}>
                    {item.subtext}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
