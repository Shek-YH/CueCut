import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, easeOutCubic } from "../00_shared/types";

export type CueCutCodeHighlightProps = BaseEffectProps & {
  code: string;
  highlightLines: number[];
  language?: string;
  width?: number;
};

export function CueCutCodeHighlight({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  code,
  highlightLines,
  language = "code",
  width = 760,
}: CueCutCodeHighlightProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);
  const lines = code.split("\n");

  return (
    <div
      className={className}
      style={{
        width,
        borderRadius: 22,
        overflow: "hidden",
        background: tokens.codeBg,
        border: `1px solid ${tokens.track}`,
        color: tokens.text,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        opacity: p,
        ...style,
      }}
    >
      <div style={{ height: 40, padding: "0 14px", display: "flex", alignItems: "center", justifyContent: "space-between", background: tokens.surface }}>
        <span style={{ fontSize: 11, color: tokens.muted }}>Highlighted code</span>
        <span style={{ fontSize: 11, color: tokens.muted }}>{language}</span>
      </div>
      <div style={{ padding: "14px 0", fontSize: 14, lineHeight: 1.62 }}>
        {lines.map((line, i) => {
          const active = highlightLines.includes(i + 1);
          return (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "42px 1fr",
                padding: "2px 16px",
                background: active ? `${tokens.accent}${Math.round(18 + p * 20).toString(16)}` : "transparent",
                borderLeft: active ? `3px solid ${tokens.accent}` : "3px solid transparent",
              }}
            >
              <span style={{ color: tokens.muted }}>{i + 1}</span>
              <span style={{ whiteSpace: "pre" }}>{line}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
