import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { pointsForData, polylinePath, areaPath } from "../00_shared/chart";
import { type BaseEffectProps, type XYDatum, easeOutCubic } from "../00_shared/types";

export type CueCutAreaChartProps = BaseEffectProps & {
  data: XYDatum[];
  title?: string;
  width?: number;
  height?: number;
};

export function CueCutAreaChart({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  data,
  title = "Growth",
  width = 720,
  height = 360,
}: CueCutAreaChartProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);
  const chartW = width - 48;
  const chartH = height - 92;
  const pts = pointsForData(data, chartW, chartH, 24, 24);
  const shown = Math.max(1, Math.ceil(data.length * p));
  const visible = pts.slice(0, shown);
  const line = polylinePath(visible);
  const area = areaPath(visible, chartH - 18);

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width,
        height,
        borderRadius: 24,
        padding: 22,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        ...style,
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 850 }}>{title}</div>
      <svg width={width - 44} height={height - 70} viewBox={`0 0 ${chartW} ${chartH}`} style={{ marginTop: 10 }}>
        <defs>
          <linearGradient id="cuecut-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={tokens.accent} stopOpacity="0.42" />
            <stop offset="100%" stopColor={tokens.accent} stopOpacity="0.03" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#cuecut-area-grad)" />
        <path d={line} stroke={tokens.accent} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
