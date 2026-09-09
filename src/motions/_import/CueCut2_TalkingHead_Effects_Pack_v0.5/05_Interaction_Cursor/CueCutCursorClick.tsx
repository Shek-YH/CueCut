import React from "react";
import { CueCutIcon } from "../00_shared/CueCutIcon";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, clamp01, pulse } from "../00_shared/types";

export type CueCutCursorClickProps = BaseEffectProps & {
  label?: string;
  x?: number;
  y?: number;
  clickAt?: number;
};

export function CueCutCursorClick({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  label,
  x = 40,
  y = 40,
  clickAt = 0.55,
}: CueCutCursorClickProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = clamp01(progress);
  const click = clamp01((p - clickAt) / 0.22);
  const ring = pulse(click, 1);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: 180,
        height: 140,
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: `${x}%`,
          top: `${y}%`,
          transform: `translate(-20%, -10%) scale(${1 - click * 0.08})`,
          color: tokens.text,
        }}
      >
        <CueCutIcon name="cursor" size={44} color={tokens.text} />
      </div>

      {click > 0 ? (
        <div
          style={{
            position: "absolute",
            left: `${x + 8}%`,
            top: `${y + 16}%`,
            width: 22 + ring * 44,
            height: 22 + ring * 44,
            borderRadius: 999,
            border: `3px solid ${tokens.accent}`,
            opacity: 1 - ring,
            transform: "translate(-50%, -50%)",
          }}
        />
      ) : null}

      {label ? (
        <div
          style={{
            position: "absolute",
            left: `${x + 12}%`,
            top: `${y + 34}%`,
            padding: "5px 8px",
            borderRadius: 8,
            background: "rgba(0,0,0,.62)",
            color: "#fff",
            fontFamily: "system-ui, sans-serif",
            fontSize: 11,
            fontWeight: 800,
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
}
