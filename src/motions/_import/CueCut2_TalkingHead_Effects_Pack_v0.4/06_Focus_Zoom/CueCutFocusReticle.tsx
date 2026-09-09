import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, easeOutCubic } from "../00_shared/types";

export type CueCutFocusReticleProps = BaseEffectProps & {
  width?: number;
  height?: number;
  corner?: number;
  label?: string;
};

export function CueCutFocusReticle({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  width = 320,
  height = 180,
  corner = 34,
  label,
}: CueCutFocusReticleProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);

  const corners = [
    { left: 0, top: 0, borderLeft: true, borderTop: true },
    { right: 0, top: 0, borderRight: true, borderTop: true },
    { left: 0, bottom: 0, borderLeft: true, borderBottom: true },
    { right: 0, bottom: 0, borderRight: true, borderBottom: true },
  ];

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width,
        height,
        opacity: p,
        transform: `scale(${0.93 + p * 0.07})`,
        ...style,
      }}
    >
      {corners.map((c, i) => (
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
            borderLeft: c.borderLeft ? `4px solid ${tokens.accent}` : undefined,
            borderRight: c.borderRight ? `4px solid ${tokens.accent}` : undefined,
            borderTop: c.borderTop ? `4px solid ${tokens.accent}` : undefined,
            borderBottom: c.borderBottom ? `4px solid ${tokens.accent}` : undefined,
          }}
        />
      ))}
      {label ? (
        <div
          style={{
            position: "absolute",
            left: 12,
            bottom: 10,
            padding: "5px 8px",
            borderRadius: 8,
            background: `${tokens.accent}dd`,
            color: "#fff",
            fontFamily: "system-ui, sans-serif",
            fontSize: 11,
            fontWeight: 850,
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
}
