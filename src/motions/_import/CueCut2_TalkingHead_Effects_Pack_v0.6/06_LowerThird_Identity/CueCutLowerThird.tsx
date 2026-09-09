import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, easeOutCubic } from "../00_shared/types";

export type CueCutLowerThirdProps = BaseEffectProps & {
  name: string;
  role?: string;
  company?: string;
  align?: "left" | "right";
};

export function CueCutLowerThird({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  name,
  role,
  company,
  align = "left",
}: CueCutLowerThirdProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);
  const right = align === "right";

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        borderRadius: 18,
        padding: "12px 16px",
        minWidth: 360,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        opacity: p,
        transform: `translateX(${(1 - p) * (right ? 30 : -30)}px)`,
        flexDirection: right ? "row-reverse" : "row",
        ...style,
      }}
    >
      <div style={{ width: 4, alignSelf: "stretch", borderRadius: 999, background: tokens.accent }} />
      <div style={{ textAlign: right ? "right" : "left" }}>
        <div style={{ fontSize: 18, fontWeight: 900 }}>{name}</div>
        {(role || company) ? (
          <div style={{ marginTop: 3, color: tokens.muted, fontSize: 12 }}>
            {[role, company].filter(Boolean).join(" · ")}
          </div>
        ) : null}
      </div>
    </div>
  );
}
