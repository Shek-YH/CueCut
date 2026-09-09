import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, type NamedValue, localProgress, easeOutCubic } from "../00_shared/types";

export type CueCutKPIGridProps = BaseEffectProps & {
  items: Array<NamedValue & { suffix?: string; note?: string }>;
  title?: string;
  columns?: 2 | 3;
  width?: number;
};

export function CueCutKPIGrid({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  items,
  title = "KPIs",
  columns = 3,
  width = 820,
}: CueCutKPIGridProps) {
  const tokens = getSkinTokens(skin, accentColor);

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
      <div style={{ fontSize: 20, fontWeight: 850, marginBottom: 14 }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))`, gap: 12 }}>
        {items.map((item, i) => {
          const p = easeOutCubic(localProgress(progress, i, items.length));
          return (
            <div
              key={item.id}
              style={{
                borderRadius: 18,
                padding: 16,
                background: tokens.surface,
                border: `1px solid ${tokens.track}`,
                opacity: p,
                transform: `translateY(${(1 - p) * 10}px)`,
              }}
            >
              <div style={{ color: tokens.muted, fontSize: 11, fontWeight: 760 }}>{item.label}</div>
              <div style={{ marginTop: 4, fontSize: 31, fontWeight: 950, color: item.color ?? tokens.palette[i % tokens.palette.length] }}>
                {Math.round(item.value * p)}{item.suffix ?? ""}
              </div>
              {item.note ? <div style={{ marginTop: 4, fontSize: 10, color: tokens.muted }}>{item.note}</div> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
