import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, clamp01, easeOutCubic } from "../00_shared/types";

export type WaterfallItem = {
  id: string;
  label: string;
  delta: number;
};

export type CueCutWaterfallChartProps = BaseEffectProps & {
  startValue: number;
  items: WaterfallItem[];
  title?: string;
  width?: number;
  height?: number;
};

export function CueCutWaterfallChart({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  startValue,
  items,
  title = "Change Breakdown",
  width = 760,
  height = 360,
}: CueCutWaterfallChartProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const values = [startValue];
  let run = startValue;
  for (const item of items) {
    run += item.delta;
    values.push(run);
  }
  const maxV = Math.max(...values, 1);
  const minV = Math.min(...values, 0);
  const y = (v: number) => 50 + (1 - (v - minV) / Math.max(0.0001, maxV - minV)) * (height - 110);
  const barW = Math.max(34, (width - 100) / (items.length + 2) * 0.6);
  const gap = (width - 100) / Math.max(1, items.length + 1);

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width,
        height,
        borderRadius: 24,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        ...style,
      }}
    >
      <svg width={width} height={height}>
        <text x="28" y="30" fill={tokens.text} fontSize="18" fontWeight="700">{title}</text>
        {items.map((item, i) => {
          const p = easeOutCubic(clamp01((progress - i * 0.08) / 0.65));
          const before = values[i];
          const after = values[i + 1];
          const top = Math.min(y(before), y(after));
          const bottom = Math.max(y(before), y(after));
          const h = Math.max(4, (bottom - top) * p);
          const x = 70 + i * gap;
          const color = item.delta >= 0 ? tokens.positive : tokens.negative;
          return (
            <g key={item.id}>
              <rect x={x} y={top} width={barW} height={h} rx="8" fill={color} />
              <text x={x + barW / 2} y={height - 28} fill={tokens.muted} fontSize="11" textAnchor="middle">{item.label}</text>
              {p > 0.9 ? (
                <text x={x + barW / 2} y={top - 8} fill={tokens.text} fontSize="11" textAnchor="middle">{item.delta > 0 ? "+" : ""}{item.delta}</text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
