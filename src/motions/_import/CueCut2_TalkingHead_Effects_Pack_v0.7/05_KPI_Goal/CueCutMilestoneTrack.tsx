import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, localProgress, easeOutCubic } from "../00_shared/types";

export type Milestone = {
  id: string;
  label: string;
  value?: string;
};

export type CueCutMilestoneTrackProps = BaseEffectProps & {
  items: Milestone[];
  title?: string;
  width?: number;
};

export function CueCutMilestoneTrack({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  items,
  title = "Milestones",
  width = 820,
}: CueCutMilestoneTrackProps) {
  const tokens = getSkinTokens(skin, accentColor);

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
      <div style={{ fontSize: 20, fontWeight: 850, marginBottom: 20 }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${items.length}, minmax(0,1fr))`, gap: 0, position: "relative" }}>
        <div style={{ position: "absolute", left: "4%", right: "4%", top: 15, height: 3, borderRadius: 999, background: tokens.track }} />
        <div style={{ position: "absolute", left: "4%", top: 15, width: `${Math.max(0, Math.min(92, progress * 92))}%`, height: 3, borderRadius: 999, background: tokens.accent }} />
        {items.map((item, i) => {
          const p = easeOutCubic(localProgress(progress, i, items.length));
          return (
            <div key={item.id} style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
              <div style={{ width: 32, height: 32, margin: "0 auto", borderRadius: 999, background: p > 0.82 ? tokens.accent : tokens.track, border: `3px solid ${p > 0.82 ? tokens.accent : tokens.muted}` }} />
              <div style={{ marginTop: 9, fontSize: 12, fontWeight: 800 }}>{item.label}</div>
              {item.value ? <div style={{ marginTop: 2, color: tokens.muted, fontSize: 10 }}>{item.value}</div> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
