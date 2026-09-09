import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, easeOutCubic } from "../00_shared/types";

export type CodeToken = {
  text: string;
  color?: string;
};

export type CodeLine = {
  tokens: CodeToken[];
  highlight?: boolean;
};

export type CueCutCodeBlockProps = BaseEffectProps & {
  lines: CodeLine[];
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
  width?: number;
};

export function CueCutCodeBlock({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  lines,
  language = "code",
  title,
  showLineNumbers = true,
  width = 760,
}: CueCutCodeBlockProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);

  return (
    <div
      className={className}
      style={{
        width,
        borderRadius: 22,
        overflow: "hidden",
        background: tokens.codeBg,
        border: `1px solid ${tokens.track}`,
        boxShadow: "0 22px 58px rgba(0,0,0,.30)",
        color: tokens.text,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        opacity: p,
        transform: `translateY(${(1 - p) * 14}px)`,
        ...style,
      }}
    >
      <div
        style={{
          height: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 14px",
          background: tokens.surface,
          borderBottom: `1px solid ${tokens.track}`,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 780 }}>{title ?? "Code"}</span>
        <span style={{ fontSize: 11, color: tokens.muted }}>{language}</span>
      </div>
      <div style={{ padding: "16px 0", fontSize: 14, lineHeight: 1.62 }}>
        {lines.map((line, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: showLineNumbers ? "42px 1fr" : "1fr",
              padding: "2px 16px",
              background: line.highlight ? `${tokens.accent}18` : "transparent",
              borderLeft: line.highlight ? `3px solid ${tokens.accent}` : "3px solid transparent",
            }}
          >
            {showLineNumbers ? (
              <span style={{ color: tokens.muted, userSelect: "none" }}>{i + 1}</span>
            ) : null}
            <span style={{ whiteSpace: "pre" }}>
              {line.tokens.map((token, j) => (
                <span key={j} style={{ color: token.color ?? tokens.text }}>{token.text}</span>
              ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
