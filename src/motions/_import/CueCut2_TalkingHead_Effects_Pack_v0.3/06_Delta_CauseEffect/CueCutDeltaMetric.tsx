import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, clamp01, easeOutCubic } from "../00_shared/types";

export type CueCutDeltaMetricProps = BaseEffectProps & {
  label: string;
  value: number;
  previous?: number;
  unit?: string;
  decimals?: number;
  invertMeaning?: boolean;
};

export function CueCutDeltaMetric({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  label,
  value,
  previous,
  unit = "",
  decimals = 0,
  invertMeaning = false,
}: CueCutDeltaMetricProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(clamp01(progress));
  const shown = value * p;
  const delta = typeof previous === "number" ? value - previous : value;
  const up = delta >= 0;
  const positive = invertMeaning ? !up : up;
  const tone = positive ? tokens.positive : tokens.negative;
  const arrow = up ? "↗" : "↘";

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width: 500,
        borderRadius: 26,
        padding: 25,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        opacity: p,
        ...style,
      }}
    >
      <div style={{ color: tokens.muted, fontSize: 14, fontWeight: 700 }}>{label}</div>
      <div style={{ marginTop: 7, display: "flex", alignItems: "baseline", gap: 12 }}>
        <div style={{ fontSize: 50, fontWeight: 950, letterSpacing: "-0.04em" }}>
          {shown.toFixed(decimals)}
          <span style={{ fontSize: 20, color: tokens.muted, marginLeft: 4 }}>{unit}</span>
        </div>
        <div
          style={{
            padding: "7px 10px",
            borderRadius: 999,
            background: `${tone}22`,
            color: tone,
            fontSize: 14,
            fontWeight: 850,
          }}
        >
          {arrow} {Math.abs(delta).toFixed(decimals)}{unit}
        </div>
      </div>
      {typeof previous === "number" ? (
        <div style={{ marginTop: 8, fontSize: 12, color: tokens.muted }}>
          Previous: {previous.toFixed(decimals)}{unit}
        </div>
      ) : null}
    </div>
  );
}
