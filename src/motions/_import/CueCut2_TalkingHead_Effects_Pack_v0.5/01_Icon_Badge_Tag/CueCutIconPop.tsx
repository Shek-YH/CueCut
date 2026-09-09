import React from "react";
import { CueCutIcon } from "../00_shared/CueCutIcon";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, type IconName, easeOutBack, easeOutCubic } from "../00_shared/types";

export type CueCutIconPopProps = BaseEffectProps & {
  icon: IconName;
  label?: string;
  size?: number;
  tone?: "accent" | "positive" | "negative" | "warning";
};

export function CueCutIconPop({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  icon,
  label,
  size = 76,
  tone = "accent",
}: CueCutIconPopProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);
  const pop = easeOutBack(progress);
  const color =
    tone === "positive" ? tokens.positive :
    tone === "negative" ? tokens.negative :
    tone === "warning" ? tokens.warning :
    tokens.accent;

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        opacity: p,
        transform: `scale(${0.45 + pop * 0.55}) rotate(${(1 - p) * -8}deg)`,
        fontFamily: "system-ui, sans-serif",
        ...style,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.28),
          display: "grid",
          placeItems: "center",
          background: `${color}24`,
          border: `2px solid ${color}`,
          boxShadow: `0 18px 38px ${color}20`,
          color,
        }}
      >
        <CueCutIcon name={icon} size={size * 0.48} color={color} />
      </div>
      {label ? (
        <div style={{ color: tokens.text, fontSize: 13, fontWeight: 800 }}>{label}</div>
      ) : null}
    </div>
  );
}
