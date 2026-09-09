import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, type NamedValue, localProgress, easeOutCubic } from "../00_shared/types";

export type CueCutHorizontalComparisonProps = BaseEffectProps & {
  items: NamedValue[];
  title?: string;
  maxItems?: number;
  width?: number;
};

export function CueCutHorizontalComparison({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  items,
  title = "Comparison",
  maxItems = 6,
  width = 720,
}: CueCutHorizontalComparisonProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const data = items.slice(0, maxItems);
  const max = Math.max(1, ...data.map((x) => x.value));

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width,
        borderRadius: 24,
        padding: 22,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        ...style,
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 850, marginBottom: 16 }}>{title}</div>
      <div style={{ display: "grid", gap: 12 }}>
        {data.map((item, i) => {
          const p = easeOutCubic(localProgress(progress, i, data.length));
          return (
            <div key={item.id} style={{ display: "grid", gridTemplateColumns: "120px 1fr 68px", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 760 }}>{item.label}</span>
              <div style={{ height: 13, borderRadius: 999, background: tokens.track, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${(item.value / max) * p * 100}%`,
                    height: "100%",
                    borderRadius: 999,
                    background: item.color ?? tokens.palette[i % tokens.palette.length],
                  }}
                />
              </div>
              <span style={{ textAlign: "right", fontSize: 13, fontWeight: 850 }}>{Math.round(item.value * p)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
