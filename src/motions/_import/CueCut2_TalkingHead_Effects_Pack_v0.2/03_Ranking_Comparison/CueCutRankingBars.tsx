import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import {
  type BaseEffectProps,
  easeOutCubic,
  segmentProgress,
} from "../00_shared/types";

export type RankingItem = {
  id: string;
  label: string;
  value: number;
  displayValue?: string;
};

export type CueCutRankingBarsProps = BaseEffectProps & {
  title?: string;
  items: RankingItem[];
  maxItems?: number;
  sortDescending?: boolean;
};

export function CueCutRankingBars({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  title = "Ranking",
  items,
  maxItems = 6,
  sortDescending = true,
}: CueCutRankingBarsProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const data = [...items]
    .sort((a, b) => (sortDescending ? b.value - a.value : 0))
    .slice(0, maxItems);
  const max = Math.max(...data.map((x) => x.value), 1);

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width: 650,
        borderRadius: 24,
        padding: 24,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        ...style,
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 780, marginBottom: 18 }}>{title}</div>
      <div style={{ display: "grid", gap: 13 }}>
        {data.map((item, index) => {
          const p = easeOutCubic(segmentProgress(progress, index, data.length));
          return (
            <div key={item.id} style={{ display: "grid", gridTemplateColumns: "38px 120px 1fr 72px", gap: 10, alignItems: "center" }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 9,
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 850,
                  background: index === 0 ? tokens.accent : tokens.track,
                  color: index === 0 ? "#fff" : tokens.text,
                  opacity: p,
                }}
              >
                {index + 1}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, opacity: p }}>{item.label}</div>
              <div style={{ height: 14, borderRadius: 999, background: tokens.track, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${(item.value / max) * p * 100}%`,
                    borderRadius: 999,
                    background: index === 0 ? tokens.accent : tokens.muted,
                  }}
                />
              </div>
              <div style={{ textAlign: "right", fontSize: 15, fontWeight: 760, opacity: p }}>
                {item.displayValue ?? Math.round(item.value * p).toString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
