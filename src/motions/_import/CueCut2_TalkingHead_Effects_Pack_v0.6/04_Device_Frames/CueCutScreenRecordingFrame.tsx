import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, easeOutCubic } from "../00_shared/types";

export type CueCutScreenRecordingFrameProps = BaseEffectProps & {
  children?: React.ReactNode;
  label?: string;
  width?: number;
  height?: number;
};

export function CueCutScreenRecordingFrame({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  children,
  label = "Screen Recording",
  width = 820,
  height = 470,
}: CueCutScreenRecordingFrameProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width,
        borderRadius: 22,
        padding: 12,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        opacity: p,
        ...style,
      }}
    >
      <div style={{ height, borderRadius: 14, overflow: "hidden", background: "#020617" }}>
        {children}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 3px 0" }}>
        <span style={{ fontSize: 11, color: tokens.muted }}>{label}</span>
        <span style={{ fontSize: 11, color: tokens.accent, fontWeight: 800 }}>● Live capture</span>
      </div>
    </div>
  );
}
