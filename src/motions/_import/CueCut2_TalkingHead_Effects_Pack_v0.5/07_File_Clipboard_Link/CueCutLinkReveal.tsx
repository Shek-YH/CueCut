import React from "react";
import { CueCutIcon } from "../00_shared/CueCutIcon";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, easeOutCubic } from "../00_shared/types";

export type CueCutLinkRevealProps = BaseEffectProps & {
  text: string;
  domain?: string;
};

export function CueCutLinkReveal({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  text,
  domain,
}: CueCutLinkRevealProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        borderRadius: 16,
        padding: "10px 13px",
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        opacity: p,
        transform: `translateX(${(1 - p) * -16}px)`,
        ...style,
      }}
    >
      <CueCutIcon name="link" size={22} color={tokens.accent} />
      <div>
        <div style={{ fontSize: 13, fontWeight: 820 }}>{text}</div>
        {domain ? <div style={{ marginTop: 2, color: tokens.muted, fontSize: 11 }}>{domain}</div> : null}
      </div>
    </div>
  );
}
