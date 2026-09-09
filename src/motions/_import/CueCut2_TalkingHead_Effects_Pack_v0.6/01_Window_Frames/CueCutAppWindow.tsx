import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { TrafficLights } from "../00_shared/window";
import { type BaseEffectProps, easeOutCubic } from "../00_shared/types";

export type CueCutAppWindowProps = BaseEffectProps & {
  appName?: string;
  sidebar?: React.ReactNode;
  children?: React.ReactNode;
  width?: number;
  height?: number;
};

export function CueCutAppWindow({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  appName = "Application",
  sidebar,
  children,
  width = 860,
  height = 540,
}: CueCutAppWindowProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width,
        height,
        borderRadius: 24,
        overflow: "hidden",
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        opacity: p,
        transform: `scale(${0.97 + p * 0.03})`,
        ...style,
      }}
    >
      <div
        style={{
          height: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          borderBottom: `1px solid ${tokens.track}`,
          background: tokens.surface,
        }}
      >
        <TrafficLights />
        <div style={{ fontSize: 13, fontWeight: 800 }}>{appName}</div>
        <div style={{ width: 46 }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: sidebar ? "180px 1fr" : "1fr", height: height - 50 }}>
        {sidebar ? (
          <div style={{ borderRight: `1px solid ${tokens.track}`, padding: 14, background: tokens.surface }}>
            {sidebar}
          </div>
        ) : null}
        <div style={{ overflow: "hidden" }}>{children}</div>
      </div>
    </div>
  );
}
