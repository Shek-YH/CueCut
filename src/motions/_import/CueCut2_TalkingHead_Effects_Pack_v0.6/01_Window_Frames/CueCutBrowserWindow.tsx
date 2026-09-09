import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { TrafficLights } from "../00_shared/window";
import { type BaseEffectProps, easeOutCubic } from "../00_shared/types";

export type CueCutBrowserWindowProps = BaseEffectProps & {
  url?: string;
  title?: string;
  children?: React.ReactNode;
  width?: number;
  height?: number;
};

export function CueCutBrowserWindow({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  url = "https://example.com",
  title,
  children,
  width = 860,
  height = 520,
}: CueCutBrowserWindowProps) {
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
        transform: `translateY(${(1 - p) * 20}px) scale(${0.98 + p * 0.02})`,
        ...style,
      }}
    >
      <div
        style={{
          height: 58,
          display: "grid",
          gridTemplateColumns: "110px 1fr 110px",
          alignItems: "center",
          gap: 14,
          padding: "0 16px",
          borderBottom: `1px solid ${tokens.track}`,
          background: tokens.surface,
        }}
      >
        <TrafficLights />
        <div
          style={{
            borderRadius: 999,
            padding: "8px 13px",
            background: tokens.track,
            color: tokens.muted,
            fontSize: 12,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            textAlign: "center",
          }}
        >
          {url}
        </div>
        <div style={{ textAlign: "right", fontSize: 11, color: tokens.muted }}>{title ?? ""}</div>
      </div>
      <div style={{ height: height - 58, background: tokens.codeBg, overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}
