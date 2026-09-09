import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, clamp01, localProgress, easeOutCubic } from "../00_shared/types";

export type HeatmapCell = {
  row: string;
  col: string;
  value: number;
};

export type CueCutHeatmapProps = BaseEffectProps & {
  rows: string[];
  cols: string[];
  cells: HeatmapCell[];
  min?: number;
  max?: number;
  width?: number;
};

export function CueCutHeatmap({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  rows,
  cols,
  cells,
  min = 0,
  max = 100,
  width = 720,
}: CueCutHeatmapProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const valueFor = (r: string, c: string) =>
    cells.find((x) => x.row === r && x.col === c)?.value ?? min;

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width,
        borderRadius: 24,
        padding: 22,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        ...style,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: `90px repeat(${cols.length}, minmax(0,1fr))`, gap: 6 }}>
        <div />
        {cols.map((c) => <div key={c} style={{ textAlign: "center", color: tokens.muted, fontSize: 11 }}>{c}</div>)}
        {rows.map((r, ri) => (
          <React.Fragment key={r}>
            <div style={{ alignSelf: "center", color: tokens.muted, fontSize: 11 }}>{r}</div>
            {cols.map((c, ci) => {
              const index = ri * cols.length + ci;
              const p = easeOutCubic(localProgress(progress, index, rows.length * cols.length));
              const value = valueFor(r, c);
              const intensity = clamp01((value - min) / Math.max(0.0001, max - min));
              return (
                <div
                  key={`${r}-${c}`}
                  style={{
                    height: 42,
                    borderRadius: 9,
                    display: "grid",
                    placeItems: "center",
                    background: tokens.accent,
                    opacity: 0.12 + intensity * 0.82 * p,
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 850,
                  }}
                >
                  {Math.round(value)}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
