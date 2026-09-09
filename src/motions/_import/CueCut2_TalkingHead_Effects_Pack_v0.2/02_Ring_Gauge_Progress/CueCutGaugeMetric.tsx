import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, clamp01, easeOutCubic } from "../00_shared/types";

export type CueCutGaugeMetricProps = BaseEffectProps & {
  value: number;
  min?: number;
  max?: number;
  label?: string;
  unit?: string;
  width?: number;
  height?: number;
};

const polar = (cx: number, cy: number, r: number, angleDeg: number) => {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
};

const arcPath = (cx: number, cy: number, r: number, start: number, end: number) => {
  const s = polar(cx, cy, r, start);
  const e = polar(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
};

export function CueCutGaugeMetric({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  value,
  min = 0,
  max = 100,
  label = "Score",
  unit = "",
  width = 360,
  height = 230,
}: CueCutGaugeMetricProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(clamp01(progress));
  const normalized = clamp01((value - min) / Math.max(0.0001, max - min));
  const shown = min + (value - min) * p;
  const cx = width / 2;
  const cy = height - 36;
  const r = Math.min(width * 0.38, height * 0.66);
  const start = 180;
  const targetEnd = 180 + normalized * 180;
  const end = 180 + (targetEnd - 180) * p;
  const needleAngle = end;

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width: width + 48,
        borderRadius: 28,
        padding: 24,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        ...style,
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <path
          d={arcPath(cx, cy, r, 180, 360)}
          fill="none"
          stroke={tokens.track}
          strokeWidth="20"
          strokeLinecap="round"
        />
        <path
          d={arcPath(cx, cy, r, start, end)}
          fill="none"
          stroke={tokens.accent}
          strokeWidth="20"
          strokeLinecap="round"
        />
        <g transform={`rotate(${needleAngle} ${cx} ${cy})`}>
          <line
            x1={cx}
            y1={cy}
            x2={cx + r - 24}
            y2={cy}
            stroke={tokens.text}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
        <circle cx={cx} cy={cy} r="9" fill={tokens.accent} />
      </svg>
      <div style={{ textAlign: "center", marginTop: -48 }}>
        <div style={{ fontSize: 46, fontWeight: 850 }}>
          {Math.round(shown)}
          <span style={{ fontSize: 22, color: tokens.muted }}>{unit}</span>
        </div>
        <div style={{ marginTop: 4, fontSize: 15, color: tokens.muted }}>{label}</div>
      </div>
    </div>
  );
}
