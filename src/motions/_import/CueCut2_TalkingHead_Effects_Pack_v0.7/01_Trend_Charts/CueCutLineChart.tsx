import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { pointsForData, polylinePath } from "../00_shared/chart";
import { type BaseEffectProps, type XYDatum, easeOutCubic } from "../00_shared/types";

export type CueCutLineChartProps = BaseEffectProps & {
  data: XYDatum[];
  title?: string;
  width?: number;
  height?: number;
  showDots?: boolean;
};

export function CueCutLineChart({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  data,
  title = "Trend",
  width = 720,
  height = 360,
  showDots = true,
}: CueCutLineChartProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);
  const pts = pointsForData(data, width - 48, height - 92, 24, 24);
  const path = polylinePath(pts);
  const shown = Math.max(1, Math.ceil(data.length * p));
  const visiblePts = pts.slice(0, shown);
  const visiblePath = polylinePath(visiblePts);

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
      <svg
        width={width - 44}
        height={height - 70}
        viewBox={`0 0 ${width - 48} ${height - 92}`}
        style={{ marginTop: 10, overflow: "visible" }}
      >
        <path d={path} stroke={tokens.track} strokeWidth="2" fill="none" />
        <path d={visiblePath} stroke={tokens.accent} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {showDots
          ? visiblePts.map((pt, i) => (
              <circle key={i} cx={pt.x} cy={pt.y} r="5" fill={tokens.accent} />
            ))
          : null}
      </svg>
    </div>
  );
}
