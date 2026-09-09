import React from "react";
import { type BaseEffectProps, easeOutBack, easeOutCubic } from "../00_shared/types";

export type CueCutEmojiPopProps = BaseEffectProps & {
  emoji: string;
  label?: string;
  size?: number;
};

export function CueCutEmojiPop({
  progress,
  className,
  style,
  emoji,
  label,
  size = 92,
}: CueCutEmojiPopProps) {
  const p = easeOutCubic(progress);
  const pop = easeOutBack(progress);

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 7,
        opacity: p,
        transform: `translateY(${(1 - p) * 16}px) scale(${0.4 + pop * 0.6})`,
        fontFamily: "system-ui, sans-serif",
        ...style,
      }}
    >
      <div style={{ fontSize: size, lineHeight: 1 }}>{emoji}</div>
      {label ? (
        <div
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            background: "rgba(0,0,0,.56)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 800,
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
}
