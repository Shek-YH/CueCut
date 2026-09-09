import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, type NamedValue, clamp01, easeOutCubic } from "../00_shared/types";

export type CueCutMultiRingProps = BaseEffectProps & {
  items: NamedValue[];
  max?: number;
  size?: number;
  title?: string;
};

export function CueCutMultiRing({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  items,
  max = 100,
  size = 340,
  title = "Metrics",
}: CueCutMultiRingProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);
  const center = size / 2;

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width: size + 180,
        borderRadius: 24,
        padding: 22,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        ...style,
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 850 }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: `${size}px 1fr`, gap: 20, alignItems: "center" }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {items.slice(0, 5).map((item, i) => {
            const r = size * 0.42 - i * 24;
            const c = 2 * Math.PI * r;
            const valueP = clamp01(item.value / Math.max(0.0001, max)) * p;
            return (
              <g key={item.id} transform={`rotate(-90 ${center} ${center})`}>
                <circle cx={center} cy={center} r={r} fill="none" stroke={tokens.track} strokeWidth="12" />
                <circle
                  cx={center}
                  cy={center}
                  r={r}
                  fill="none"
                  stroke={item.color ?? tokens.palette[i % tokens.palette.length]}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={c}
                  strokeDashoffset={c * (1 - valueP)}
                />
              </g>
            );
          })}
        </svg>

        <div style={{ display: "grid", gap: 10 }}>
          {items.slice(0, 5).map((item, i) => (
            <div key={item.id}>
              <div style={{ fontSize: 12, color: tokens.muted }}>{item.label}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: item.color ?? tokens.palette[i % tokens.palette.length] }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
