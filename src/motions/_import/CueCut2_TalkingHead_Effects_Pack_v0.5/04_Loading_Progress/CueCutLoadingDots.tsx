import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, clamp01 } from "../00_shared/types";

export type CueCutLoadingDotsProps = BaseEffectProps & {
  label?: string;
  dotCount?: number;
};

export function CueCutLoadingDots({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  label = "Processing",
  dotCount = 3,
}: CueCutLoadingDotsProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = clamp01(progress);

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        borderRadius: 999,
        padding: "10px 15px",
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        ...style,
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 800 }}>{label}</span>
      <span style={{ display: "inline-flex", gap: 5 }}>
        {Array.from({ length: dotCount }).map((_, i) => {
          const phase = (p * dotCount * 2 - i) % dotCount;
          const active = phase >= 0 && phase < 1 ? 1 : 0.35;
          return (
            <span
              key={i}
              style={{
                width: 7,
                height: 7,
                borderRadius: 999,
                background: tokens.accent,
                opacity: active,
                transform: `translateY(${active > 0.5 ? -3 : 0}px)`,
              }}
            />
          );
        })}
      </span>
    </div>
  );
}
