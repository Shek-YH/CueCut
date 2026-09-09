import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, easeOutCubic } from "../00_shared/types";

export type CueCutCaptionPillProps = BaseEffectProps & {
  text: string;
  keyword?: string;
  prefix?: string;
  fontSize?: number;
};

export function CueCutCaptionPill({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  text,
  keyword,
  prefix,
  fontSize = 42,
}: CueCutCaptionPillProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);
  const parts = keyword ? text.split(keyword) : [text];

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        borderRadius: 999,
        padding: "12px 20px",
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        fontSize,
        fontWeight: 850,
        lineHeight: 1.2,
        opacity: p,
        transform: `translateY(${(1 - p) * 12}px) scale(${0.97 + p * 0.03})`,
        ...style,
      }}
    >
      {prefix ? (
        <span
          style={{
            color: tokens.accent,
            fontSize: Math.max(14, fontSize * 0.36),
            fontWeight: 900,
            letterSpacing: 1.2,
          }}
        >
          {prefix}
        </span>
      ) : null}
      <span>
        {keyword && parts.length > 1 ? (
          <>
            {parts[0]}
            <span style={{ color: tokens.accent }}>{keyword}</span>
            {parts.slice(1).join(keyword)}
          </>
        ) : (
          text
        )}
      </span>
    </div>
  );
}
