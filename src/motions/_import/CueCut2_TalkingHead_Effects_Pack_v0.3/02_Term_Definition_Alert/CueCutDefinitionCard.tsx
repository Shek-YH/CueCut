import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, easeOutCubic } from "../00_shared/types";

export type CueCutDefinitionCardProps = BaseEffectProps & {
  title: string;
  definition: string;
  example?: string;
  prefix?: string;
};

export function CueCutDefinitionCard({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  title,
  definition,
  example,
  prefix = "WHAT IS",
}: CueCutDefinitionCardProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width: 660,
        borderRadius: 28,
        padding: 28,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        opacity: p,
        ...style,
      }}
    >
      <div style={{ color: tokens.accent, fontSize: 12, letterSpacing: 1.3, fontWeight: 850 }}>
        {prefix}
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: 34,
          fontWeight: 900,
          transform: `translateY(${(1 - p) * 10}px)`,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 16,
          paddingLeft: 16,
          borderLeft: `4px solid ${tokens.accent}`,
          color: tokens.text,
          fontSize: 20,
          lineHeight: 1.5,
        }}
      >
        {definition}
      </div>

      {example ? (
        <div
          style={{
            marginTop: 18,
            borderRadius: 16,
            padding: "13px 15px",
            background: tokens.track,
            color: tokens.muted,
            fontSize: 14,
          }}
        >
          <strong style={{ color: tokens.text }}>Example:</strong> {example}
        </div>
      ) : null}
    </div>
  );
}
