import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, easeOutCubic } from "../00_shared/types";

export type CueCutCameraFrameProps = BaseEffectProps & {
  children?: React.ReactNode;
  label?: string;
  width?: number;
  height?: number;
};

export function CueCutCameraFrame({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  children,
  label = "REC",
  width = 700,
  height = 420,
}: CueCutCameraFrameProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);

  const corner = 38;
  const positions = [
    { left: 16, top: 16, borderLeft: true, borderTop: true },
    { right: 16, top: 16, borderRight: true, borderTop: true },
    { left: 16, bottom: 16, borderLeft: true, borderBottom: true },
    { right: 16, bottom: 16, borderRight: true, borderBottom: true },
  ];

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width,
        height,
        overflow: "hidden",
        borderRadius: 18,
        background: "#020617",
        opacity: p,
        ...style,
      }}
    >
      {children}
      {positions.map((c, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: corner,
            height: corner,
            ...(c.left !== undefined ? { left: c.left } : {}),
            ...(c.right !== undefined ? { right: c.right } : {}),
            ...(c.top !== undefined ? { top: c.top } : {}),
            ...(c.bottom !== undefined ? { bottom: c.bottom } : {}),
            borderLeft: c.borderLeft ? `3px solid ${tokens.accent}` : undefined,
            borderRight: c.borderRight ? `3px solid ${tokens.accent}` : undefined,
            borderTop: c.borderTop ? `3px solid ${tokens.accent}` : undefined,
            borderBottom: c.borderBottom ? `3px solid ${tokens.accent}` : undefined,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: 20,
          top: 20,
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          fontSize: 11,
          fontWeight: 850,
        }}
      >
        <span style={{ width: 9, height: 9, borderRadius: 999, background: "#ef4444" }} />
        {label}
      </div>
    </div>
  );
}
