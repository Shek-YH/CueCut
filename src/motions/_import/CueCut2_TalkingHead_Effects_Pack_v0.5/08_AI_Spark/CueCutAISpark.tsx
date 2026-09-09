import React from "react";
import { CueCutIcon } from "../00_shared/CueCutIcon";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, easeOutBack, easeOutCubic, pulse } from "../00_shared/types";

export type CueCutAISparkProps = BaseEffectProps & {
  text?: string;
  orbitCount?: number;
};

export function CueCutAISpark({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  text = "AI",
  orbitCount = 6,
}: CueCutAISparkProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);
  const pop = easeOutBack(progress);
  const glow = pulse(progress, 1);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: 220,
        height: 220,
        display: "grid",
        placeItems: "center",
        fontFamily: "system-ui, sans-serif",
        opacity: p,
        ...style,
      }}
    >
      {Array.from({ length: orbitCount }).map((_, i) => {
        const angle = (360 / orbitCount) * i + progress * 80;
        const radius = 70 + (i % 2) * 18;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: `rotate(${angle}deg) translateX(${radius}px) rotate(${-angle}deg)`,
              color: tokens.accent,
              opacity: 0.35 + p * 0.65,
            }}
          >
            <CueCutIcon name="spark" size={14 + (i % 3) * 3} color={tokens.accent} />
          </div>
        );
      })}

      <div
        style={{
          width: 102,
          height: 102,
          borderRadius: 30,
          display: "grid",
          placeItems: "center",
          background: `${tokens.accent}20`,
          border: `2px solid ${tokens.accent}`,
          boxShadow: `0 0 ${28 + glow * 28}px ${tokens.accent}44`,
          color: tokens.text,
          fontSize: 34,
          fontWeight: 950,
          transform: `scale(${0.7 + pop * 0.3})`,
        }}
      >
        {text}
      </div>
    </div>
  );
}
