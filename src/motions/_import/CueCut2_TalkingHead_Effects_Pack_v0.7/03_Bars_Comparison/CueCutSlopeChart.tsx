import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, easeOutCubic } from "../00_shared/types";

export type SlopeItem = {
  id: string;
  label: string;
  from: number;
  to: number;
  color?: string;
};

export type CueCutSlopeChartProps = BaseEffectProps & {
  items: SlopeItem[];
  fromLabel?: string;
  toLabel?: string;
  width?: number;
  height?: number;
};

export function CueCutSlopeChart({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  items,
  fromLabel = "Before",
  toLabel = "After",
  width = 720,
  height = 360,
}: CueCutSlopeChartProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);
  const vals = items.flatMap((x) => [x.from, x.to]);
  const min = Math.min(...vals, 0);
  const max = Math.max(...vals, 1);
  const mapY = (v: number) => 54 + (1 - (v - min) / Math.max(0.0001, max - min)) * (height - 110);
  const x1 = 120;
  const x2 = width - 120;

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width,
        height,
        borderRadius: 24,
        padding: 0,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        ...style,
      }}
    >
      <svg width={width} height={height}>
        <text x={x1} y="32" fill={tokens.muted} textAnchor="middle" fontSize="12">{fromLabel}</text>
        <text x={x2} y="32" fill={tokens.muted} textAnchor="middle" fontSize="12">{toLabel}</text>
        {items.map((item, i) => {
          const y1 = mapY(item.from);
          const y2 = mapY(item.to);
          const color = item.color ?? tokens.palette[i % tokens.palette.length];
          const currentX = x1 + (x2 - x1) * p;
          const currentY = y1 + (y2 - y1) * p;
          return (
            <g key={item.id}>
              <line x1={x1} y1={y1} x2={currentX} y2={currentY} stroke={color} strokeWidth="4" strokeLinecap="round" />
              <circle cx={x1} cy={y1} r="5" fill={color} />
              <circle cx={currentX} cy={currentY} r="5" fill={color} />
              <text x={x1 - 10} y={y1 + 4} fill={tokens.text} textAnchor="end" fontSize="12">{item.label} {item.from}</text>
              {p > 0.88 ? (
                <text x={x2 + 10} y={y2 + 4} fill={tokens.text} textAnchor="start" fontSize="12">{item.to}</text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
