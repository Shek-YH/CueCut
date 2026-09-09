import React from "react";
import { CueCutIcon } from "../00_shared/CueCutIcon";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, easeOutCubic, pulse } from "../00_shared/types";

export type CueCutAIProcessingBadgeProps = BaseEffectProps & {
  text?: string;
  doneText?: string;
};

export function CueCutAIProcessingBadge({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  text = "AI Processing",
  doneText = "AI Complete",
}: CueCutAIProcessingBadgeProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);
  const active = progress < 0.82;
  const wave = pulse(progress, 3);

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        borderRadius: 999,
        padding: "9px 13px",
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        opacity: p,
        ...style,
      }}
    >
      <span style={{ color: active ? tokens.accent : tokens.positive, transform: `scale(${0.92 + wave * 0.12})` }}>
        <CueCutIcon name={active ? "spark" : "check"} size={22} color={active ? tokens.accent : tokens.positive} />
      </span>
      <span style={{ fontSize: 13, fontWeight: 830 }}>{active ? text : doneText}</span>
    </div>
  );
}
