import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, typeByProgress, easeOutCubic } from "../00_shared/types";

export type CueCutCodeTypingProps = BaseEffectProps & {
  code: string;
  language?: string;
  title?: string;
  width?: number;
  maxHeight?: number;
};

export function CueCutCodeTyping({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  code,
  language = "ts",
  title = "Typing…",
  width = 760,
  maxHeight = 440,
}: CueCutCodeTypingProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);
  const typed = typeByProgress(code, progress);

  return (
    <div
      className={className}
      style={{
        width,
        maxHeight,
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
      <div style={{ height: 42, padding: "0 14px", display: "flex", alignItems: "center", justifyContent: "space-between", background: tokens.surface }}>
        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 780 }}>{title}</span>
        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: tokens.muted }}>{language}</span>
      </div>
      <pre style={{ margin: 0, padding: 18, fontSize: 14, lineHeight: 1.62, whiteSpace: "pre-wrap", overflow: "hidden" }}>
        {typed}<span style={{ color: tokens.accent }}>▋</span>
      </pre>
    </div>
  );
}
