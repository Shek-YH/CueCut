import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { pointsForData, polylinePath } from "../00_shared/chart";
import { type BaseEffectProps, type XYDatum, easeOutCubic } from "../00_shared/types";

export type CueCutNumberTrendProps = BaseEffectProps & {
  value: number;
  label: string;
  trend: XYDatum[];
  unit?: string;
  change?: number;
  width?: number;
};

export function CueCutNumberTrend({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  value,
  label,
  trend,
  unit = "",
  change,
  width = 520,
}: CueCutNumberTrendProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);
  const shown = value * p;
  const pts = pointsForData(trend, 180, 66, 4, 6);
  const shownPts = pts.slice(0, Math.max(1, Math.ceil(trend.length * p)));
  const line = polylinePath(shownPts);
  const tone = change === undefined ? tokens.accent : change >= 0 ? tokens.positive : tokens.negative;

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width,
        borderRadius: 24,
        padding: 20,
        display: "grid",
        gridTemplateColumns: "1fr 190px",
        gap: 18,
        alignItems: "center",
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        ...style,
      }}
    >
      <div>
        <div style={{ color: tokens.muted, fontSize: 12, fontWeight: 760 }}>{label}</div>
        <div style={{ marginTop: 5, fontSize: 40, fontWeight: 950 }}>
          {Math.round(shown)}{unit}
        </div>
        {change !== undefined ? (
          <div style={{ marginTop: 5, color: tone, fontSize: 12, fontWeight: 820 }}>
            {change >= 0 ? "↗" : "↘"} {Math.abs(change)}{unit}
          </div>
        ) : null}
      </div>
      <svg width="190" height="72" viewBox="0 0 180 66">
        <path d={line} stroke={tone} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
