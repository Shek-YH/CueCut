import React from "react";
import { CueCutIcon } from "../00_shared/CueCutIcon";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, easeOutCubic, pulse } from "../00_shared/types";

export type CueCutMouseClickProps = BaseEffectProps & {
  button?: "left" | "right";
  label?: string;
};

export function CueCutMouseClick({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  button = "left",
  label,
}: CueCutMouseClickProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);
  const press = pulse(progress, 1);

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        borderRadius: 20,
        padding: 16,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        opacity: p,
        ...style,
      }}
    >
      <div style={{ position: "relative", width: 58, height: 72, display: "grid", placeItems: "center" }}>
        <CueCutIcon name="mouse" size={58} color={tokens.text} />
        <div
          style={{
            position: "absolute",
            top: 3,
            [button === "left" ? "left" : "right"]: 8,
            width: 20,
            height: 28,
            borderRadius: "12px 12px 4px 4px",
            background: tokens.accent,
            opacity: 0.25 + press * 0.75,
          }}
        />
      </div>
      {label ? <div style={{ fontSize: 12, fontWeight: 760 }}>{label}</div> : null}
    </div>
  );
}
