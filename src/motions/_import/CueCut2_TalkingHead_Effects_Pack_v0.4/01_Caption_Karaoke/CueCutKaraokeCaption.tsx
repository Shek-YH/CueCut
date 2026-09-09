import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import {
  type BaseEffectProps,
  type CueWord,
  clamp01,
  localCueProgress,
} from "../00_shared/types";

export type CueCutKaraokeCaptionProps = BaseEffectProps & {
  words: CueWord[];
  activeMode?: "fill" | "pill" | "scale";
  fontSize?: number;
  maxWidth?: number;
  inactiveOpacity?: number;
};

export function CueCutKaraokeCaption({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  words,
  activeMode = "fill",
  fontSize = 48,
  maxWidth = 900,
  inactiveOpacity = 0.42,
}: CueCutKaraokeCaptionProps) {
  const tokens = getSkinTokens(skin, accentColor);

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        maxWidth,
        borderRadius: 22,
        padding: "16px 22px",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "4px 10px",
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        fontSize,
        fontWeight: 850,
        lineHeight: 1.28,
        textAlign: "center",
        ...style,
      }}
    >
      {words.map((word, index) => {
        const local = localCueProgress(progress, word.cue, index, words.length);
        const active = local > 0 && local < 1;
        const completed = local >= 1;
        const activation = clamp01(local * 2.2);

        const common: React.CSSProperties = {
          display: "inline-block",
          opacity: active || completed ? 1 : inactiveOpacity,
          transition: "none",
          transform:
            activeMode === "scale" && active
              ? `scale(${1 + activation * 0.12})`
              : undefined,
          color:
            activeMode === "fill" && (active || completed)
              ? tokens.accent
              : tokens.text,
          padding: activeMode === "pill" && active ? "1px 7px" : "1px 0",
          borderRadius: activeMode === "pill" ? 9 : undefined,
          background:
            activeMode === "pill" && active ? `${tokens.accent}2a` : undefined,
        };

        return (
          <span key={word.id} style={common}>
            {word.text}
          </span>
        );
      })}
    </div>
  );
}
