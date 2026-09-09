import React from "react";
import { donutArcPath } from "../00_shared/chart";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, type NamedValue, easeOutCubic } from "../00_shared/types";

export type CueCutDonutChartProps = BaseEffectProps & {
  items: NamedValue[];
  title?: string;
  centerLabel?: string;
  centerValue?: string;
  size?: number;
};

export function CueCutDonutChart({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  items,
  title = "Distribution",
  centerLabel,
  centerValue,
  size = 320,
}: CueCutDonutChartProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);
  const total = Math.max(0.0001, items.reduce((s, x) => s + Math.max(0, x.value), 0));
  let cursor = 0;

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width: size + 260,
        borderRadius: 24,
        padding: 22,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        ...style,
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 850 }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: `${size}px 1fr`, gap: 22, alignItems: "center", marginTop: 12 }}>
        <div style={{ position: "relative", width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {items.map((item, i) => {
              const share = Math.max(0, item.value) / total;
              const start = cursor;
              const end = cursor + share * 360 * p;
              cursor += share * 360;
              return (
                <path
                  key={item.id}
                  d={donutArcPath(size / 2, size / 2, size * 0.42, size * 0.26, start, end)}
                  fill={item.color ?? tokens.palette[i % tokens.palette.length]}
                />
              );
            })}
          </svg>
          {(centerLabel || centerValue) ? (
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
              <div>
                {centerValue ? <div style={{ fontSize: 32, fontWeight: 950 }}>{centerValue}</div> : null}
                {centerLabel ? <div style={{ marginTop: 3, color: tokens.muted, fontSize: 12 }}>{centerLabel}</div> : null}
              </div>
            </div>
          ) : null}
        </div>

        <div style={{ display: "grid", gap: 9 }}>
          {items.map((item, i) => (
            <div key={item.id} style={{ display: "grid", gridTemplateColumns: "12px 1fr auto", gap: 8, alignItems: "center" }}>
              <span style={{ width: 10, height: 10, borderRadius: 999, background: item.color ?? tokens.palette[i % tokens.palette.length] }} />
              <span style={{ fontSize: 13, color: tokens.muted }}>{item.label}</span>
              <span style={{ fontSize: 13, fontWeight: 800 }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
