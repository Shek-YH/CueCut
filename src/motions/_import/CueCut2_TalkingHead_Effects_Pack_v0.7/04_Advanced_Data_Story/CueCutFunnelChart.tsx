import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, type NamedValue, localProgress, easeOutCubic } from "../00_shared/types";

export type CueCutFunnelChartProps = BaseEffectProps & {
  items: NamedValue[];
  title?: string;
  width?: number;
};

export function CueCutFunnelChart({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  items,
  title = "Funnel",
  width = 650,
}: CueCutFunnelChartProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const max = Math.max(1, ...items.map((x) => x.value));

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
      <div style={{ display: "grid", gap: 8, justifyItems: "center" }}>
        {items.map((item, i) => {
          const p = easeOutCubic(localProgress(progress, i, items.length));
          const targetW = Math.max(28, item.value / max * 100);
          return (
            <div
              key={item.id}
              style={{
                width: `${targetW * p}%`,
                minWidth: p > 0.1 ? 120 : 0,
                borderRadius: 12,
                background: item.color ?? tokens.palette[i % tokens.palette.length],
                color: "#fff",
                padding: p > 0.1 ? "11px 14px" : "11px 0",
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 800 }}>{item.label}</span>
              <strong>{Math.round(item.value * p)}</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}
