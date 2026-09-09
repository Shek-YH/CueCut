import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, clamp01, easeOutCubic } from "../00_shared/types";

export type CueCutProgressMetricProps = BaseEffectProps & {
  value: number;
  max?: number;
  label?: string;
  unit?: string;
  showValue?: boolean;
};

export function CueCutProgressMetric({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  value,
  max = 100,
  label = "Progress",
  unit = "%",
  showValue = true,
}: CueCutProgressMetricProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(clamp01(progress));
  const normalized = clamp01(value / Math.max(0.0001, max));
  const shown = value * p;

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
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{label}</div>
        {showValue ? (
          <div style={{ fontSize: 30, fontWeight: 850 }}>
            {Math.round(shown)}
            <span style={{ fontSize: 16, color: tokens.muted }}>{unit}</span>
          </div>
        ) : null}
      </div>

      <div
        style={{
          height: 18,
          borderRadius: 999,
          background: tokens.track,
          overflow: "hidden",
          marginTop: 16,
        }}
      >
        <div
          style={{
            width: `${normalized * p * 100}%`,
            height: "100%",
            borderRadius: 999,
            background: tokens.accent,
          }}
        />
      </div>
    </div>
  );
}
