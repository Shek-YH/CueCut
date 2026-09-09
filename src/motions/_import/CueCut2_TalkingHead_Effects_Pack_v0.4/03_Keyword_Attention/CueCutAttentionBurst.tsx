import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, easeOutBack, clamp01 } from "../00_shared/types";

export type CueCutAttentionBurstProps = BaseEffectProps & {
  text: string;
  rayCount?: number;
};

export function CueCutAttentionBurst({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  text,
  rayCount = 12,
}: CueCutAttentionBurstProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = clamp01(progress);
  const pop = easeOutBack(progress);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: 340,
        height: 220,
        display: "grid",
        placeItems: "center",
        fontFamily: "system-ui, sans-serif",
        color: tokens.text,
        ...style,
      }}
    >
      {Array.from({ length: rayCount }).map((_, i) => {
        const angle = (360 / rayCount) * i;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 42 * p,
              height: 4,
              borderRadius: 999,
              background: tokens.accent,
              transformOrigin: "0 50%",
              transform: `rotate(${angle}deg) translateX(70px)`,
              opacity: p * 0.85,
            }}
          />
        );
      })}
      <div
        style={{
          padding: "12px 20px",
          borderRadius: 20,
          background: tokens.panel.background,
          border: `2px solid ${tokens.accent}`,
          boxShadow: `0 18px 50px ${tokens.accent}26`,
          fontSize: 36,
          fontWeight: 950,
          transform: `scale(${0.65 + pop * 0.35})`,
          zIndex: 1,
        }}
      >
        {text}
      </div>
    </div>
  );
}
