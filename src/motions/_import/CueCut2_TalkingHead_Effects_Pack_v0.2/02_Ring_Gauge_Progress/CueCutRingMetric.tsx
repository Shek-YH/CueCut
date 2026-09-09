import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, clamp01, easeOutCubic } from "../00_shared/types";

export type CueCutRingMetricProps = BaseEffectProps & {
  value: number;
  max?: number;
  label?: string;
  unit?: string;
  size?: number;
  strokeWidth?: number;
  decimals?: number;
};

export function CueCutRingMetric({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  value,
  max = 100,
  label = "Completion",
  unit = "%",
  size = 260,
  strokeWidth = 18,
  decimals = 0,
}: CueCutRingMetricProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(clamp01(progress));
  const normalized = clamp01(value / Math.max(0.0001, max));
  const shown = value * p;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - normalized * p);

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width: size + 64,
        borderRadius: 28,
        padding: 28,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        textAlign: "center",
        ...style,
      }}
    >
      <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={tokens.track}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={tokens.accent}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 54, lineHeight: 1, fontWeight: 850 }}>
              {shown.toFixed(decimals)}
              <span style={{ fontSize: 26, color: tokens.muted, marginLeft: 4 }}>{unit}</span>
            </div>
            <div style={{ marginTop: 10, fontSize: 15, color: tokens.muted }}>{label}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
