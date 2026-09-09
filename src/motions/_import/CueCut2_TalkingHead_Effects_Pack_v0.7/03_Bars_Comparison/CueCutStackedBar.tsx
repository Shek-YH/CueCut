import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, type NamedValue, easeOutCubic } from "../00_shared/types";

export type CueCutStackedBarProps = BaseEffectProps & {
  items: NamedValue[];
  title?: string;
  totalLabel?: string;
  width?: number;
};

export function CueCutStackedBar({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  items,
  title = "Breakdown",
  totalLabel,
  width = 720,
}: CueCutStackedBarProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);
  const total = Math.max(0.0001, items.reduce((s, x) => s + Math.max(0, x.value), 0));

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 20, fontWeight: 850 }}>{title}</span>
        {totalLabel ? <span style={{ color: tokens.muted, fontSize: 12 }}>{totalLabel}</span> : null}
      </div>
      <div style={{ marginTop: 18, height: 28, borderRadius: 999, display: "flex", overflow: "hidden", background: tokens.track }}>
        {items.map((item, i) => (
          <div
            key={item.id}
            style={{
              width: `${(item.value / total) * p * 100}%`,
              background: item.color ?? tokens.palette[i % tokens.palette.length],
            }}
          />
        ))}
      </div>
      <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
        {items.map((item, i) => (
          <div key={item.id} style={{ display: "inline-flex", gap: 7, alignItems: "center", fontSize: 12 }}>
            <span style={{ width: 9, height: 9, borderRadius: 999, background: item.color ?? tokens.palette[i % tokens.palette.length] }} />
            <span style={{ color: tokens.muted }}>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
