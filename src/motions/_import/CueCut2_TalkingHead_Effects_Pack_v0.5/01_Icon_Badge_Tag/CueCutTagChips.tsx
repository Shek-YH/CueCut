import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, easeOutCubic, clamp01 } from "../00_shared/types";

export type CueCutTagChipsProps = BaseEffectProps & {
  tags: string[];
  max?: number;
};

export function CueCutTagChips({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  tags,
  max = 6,
}: CueCutTagChipsProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const data = tags.slice(0, max);

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        maxWidth: 560,
        fontFamily: "system-ui, sans-serif",
        ...style,
      }}
    >
      {data.map((tag, i) => {
        const start = i / Math.max(1, data.length) * 0.68;
        const p = easeOutCubic(clamp01((progress - start) / 0.32));
        return (
          <div
            key={`${tag}-${i}`}
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              border: `1px solid ${tokens.accent}55`,
              background: `${tokens.accent}17`,
              color: tokens.text,
              fontSize: 13,
              fontWeight: 760,
              opacity: p,
              transform: `translateY(${(1 - p) * 8}px) scale(${0.95 + p * 0.05})`,
            }}
          >
            #{tag}
          </div>
        );
      })}
    </div>
  );
}
