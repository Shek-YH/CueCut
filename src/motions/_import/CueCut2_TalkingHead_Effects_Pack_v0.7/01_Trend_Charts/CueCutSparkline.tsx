import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { pointsForData, polylinePath } from "../00_shared/chart";
import { type BaseEffectProps, type XYDatum, easeOutCubic } from "../00_shared/types";

export type CueCutSparklineProps = BaseEffectProps & {
  data: XYDatum[];
  label?: string;
  value?: string;
  width?: number;
  height?: number;
};

export function CueCutSparkline({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  data,
  label,
  value,
  width = 380,
  height = 120,
}: CueCutSparklineProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);
  const pts = pointsForData(data, width - 20, 58, 8, 8);
  const shown = Math.max(1, Math.ceil(data.length * p));
  const line = polylinePath(pts.slice(0, shown));

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width,
        minHeight: height,
        borderRadius: 20,
        padding: 16,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        ...style,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ color: tokens.muted, fontSize: 12, fontWeight: 760 }}>{label}</span>
        {value ? <span style={{ fontSize: 22, fontWeight: 900 }}>{value}</span> : null}
      </div>
      <svg width={width - 32} height="62" viewBox={`0 0 ${width - 20} 58`} style={{ marginTop: 10 }}>
        <path d={line} stroke={tokens.accent} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
