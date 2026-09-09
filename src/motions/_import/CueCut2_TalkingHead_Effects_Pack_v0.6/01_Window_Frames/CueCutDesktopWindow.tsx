import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, easeOutCubic } from "../00_shared/types";

export type CueCutDesktopWindowProps = BaseEffectProps & {
  title?: string;
  children?: React.ReactNode;
  width?: number;
  height?: number;
};

export function CueCutDesktopWindow({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  title = "Window",
  children,
  width = 760,
  height = 480,
}: CueCutDesktopWindowProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);

  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius: 18,
        overflow: "hidden",
        border: `1px solid ${tokens.track}`,
        background: tokens.codeBg,
        boxShadow: "0 24px 64px rgba(0,0,0,.30)",
        opacity: p,
        transform: `translateY(${(1 - p) * 16}px)`,
        fontFamily: "system-ui, sans-serif",
        ...style,
      }}
    >
      <div
        style={{
          height: 42,
          padding: "0 13px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: tokens.surface,
          color: tokens.text,
          borderBottom: `1px solid ${tokens.track}`,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 780 }}>{title}</span>
        <div style={{ display: "flex", gap: 7, color: tokens.muted, fontSize: 13 }}>
          <span>—</span><span>□</span><span>×</span>
        </div>
      </div>
      <div style={{ height: height - 42 }}>{children}</div>
    </div>
  );
}
