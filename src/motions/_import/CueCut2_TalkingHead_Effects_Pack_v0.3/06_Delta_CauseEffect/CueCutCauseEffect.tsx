import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, easeOutCubic } from "../00_shared/types";

export type CueCutCauseEffectProps = BaseEffectProps & {
  cause: string;
  effect: string;
  causeLabel?: string;
  effectLabel?: string;
};

export function CueCutCauseEffect({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  cause,
  effect,
  causeLabel = "CAUSE",
  effectLabel = "EFFECT",
}: CueCutCauseEffectProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);
  const rightP = Math.max(0, Math.min(1, (p - 0.22) / 0.78));
  const lineP = Math.max(0, Math.min(1, (p - 0.1) / 0.55));

  const box = (label: string, text: string, amount: number) => (
    <div
      style={{
        flex: 1,
        minHeight: 150,
        borderRadius: 20,
        padding: 20,
        background: "rgba(255,255,255,0.05)",
        border: `1px solid ${tokens.track}`,
        opacity: amount,
        transform: `scale(${0.96 + amount * 0.04})`,
      }}
    >
      <div style={{ color: tokens.accent, fontSize: 11, fontWeight: 850, letterSpacing: 1.2 }}>
        {label}
      </div>
      <div style={{ marginTop: 10, fontSize: 21, fontWeight: 800, lineHeight: 1.42 }}>{text}</div>
    </div>
  );

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width: 780,
        borderRadius: 28,
        padding: 24,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {box(causeLabel, cause, p)}
        <div style={{ width: 80, flex: "0 0 auto", position: "relative", height: 34 }}>
          <div
            style={{
              position: "absolute",
              top: 16,
              left: 0,
              height: 3,
              width: `${lineP * 62}px`,
              borderRadius: 999,
              background: tokens.accent,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 9,
              right: 1,
              fontSize: 24,
              color: tokens.accent,
              opacity: lineP,
            }}
          >
            →
          </div>
        </div>
        {box(effectLabel, effect, rightP)}
      </div>
    </div>
  );
}
