import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, clamp01, easeOutCubic } from "../00_shared/types";

export type CueCutGoalVsActualProps = BaseEffectProps & {
  actual: number;
  goal: number;
  label?: string;
  unit?: string;
  width?: number;
};

export function CueCutGoalVsActual({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  actual,
  goal,
  label = "Goal",
  unit = "",
  width = 620,
}: CueCutGoalVsActualProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);
  const ratio = clamp01(actual / Math.max(0.0001, goal));
  const shown = actual * p;

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 14, color: tokens.muted, fontWeight: 760 }}>{label}</span>
        <span style={{ fontSize: 30, fontWeight: 950 }}>{Math.round(shown)}{unit} <span style={{ fontSize: 13, color: tokens.muted }}>/ {goal}{unit}</span></span>
      </div>
      <div style={{ position: "relative", marginTop: 18, height: 18, borderRadius: 999, background: tokens.track }}>
        <div style={{ width: `${ratio * p * 100}%`, height: "100%", borderRadius: 999, background: ratio >= 1 ? tokens.positive : tokens.accent }} />
        <div style={{ position: "absolute", left: "100%", top: -5, width: 2, height: 28, background: tokens.text, opacity: 0.5 }} />
      </div>
    </div>
  );
}
