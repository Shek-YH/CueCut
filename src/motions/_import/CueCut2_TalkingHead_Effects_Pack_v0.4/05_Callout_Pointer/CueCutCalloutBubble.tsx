import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, easeOutBack, easeOutCubic } from "../00_shared/types";

export type CueCutCalloutBubbleProps = BaseEffectProps & {
  text: string;
  label?: string;
  tail?: "bottom-left" | "bottom-right" | "top-left" | "top-right";
};

export function CueCutCalloutBubble({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  text,
  label,
  tail = "bottom-left",
}: CueCutCalloutBubbleProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);
  const pop = easeOutBack(progress);
  const bottom = tail.startsWith("bottom");
  const left = tail.endsWith("left");

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        position: "relative",
        width: 470,
        borderRadius: 22,
        padding: 20,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        opacity: p,
        transform: `scale(${0.92 + pop * 0.08})`,
        ...style,
      }}
    >
      {label ? (
        <div style={{ color: tokens.accent, fontSize: 11, letterSpacing: 1.1, fontWeight: 850 }}>
          {label}
        </div>
      ) : null}
      <div style={{ marginTop: label ? 7 : 0, fontSize: 21, lineHeight: 1.42, fontWeight: 800 }}>
        {text}
      </div>
      <div
        style={{
          position: "absolute",
          width: 20,
          height: 20,
          background: (tokens.panel.background as string) || "#111827",
          transform: "rotate(45deg)",
          ...(bottom ? { bottom: -10 } : { top: -10 }),
          ...(left ? { left: 38 } : { right: 38 }),
        }}
      />
    </div>
  );
}
