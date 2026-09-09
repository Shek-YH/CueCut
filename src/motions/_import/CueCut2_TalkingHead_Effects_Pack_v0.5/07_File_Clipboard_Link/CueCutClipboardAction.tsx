import React from "react";
import { CueCutIcon } from "../00_shared/CueCutIcon";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, type IconName, easeOutBack, easeOutCubic } from "../00_shared/types";

export type ClipboardAction = "copy" | "paste";

export type CueCutClipboardActionProps = BaseEffectProps & {
  action: ClipboardAction;
  text?: string;
};

export function CueCutClipboardAction({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  action,
  text,
}: CueCutClipboardActionProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);
  const pop = easeOutBack(progress);
  const complete = progress > 0.72;
  const icon: IconName = complete ? "check" : "copy";
  const label = text ?? (action === "copy" ? "Copied" : "Pasted");

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        borderRadius: 16,
        padding: "11px 14px",
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        opacity: p,
        transform: `scale(${0.88 + pop * 0.12})`,
        ...style,
      }}
    >
      <CueCutIcon name={icon} size={22} color={complete ? tokens.positive : tokens.accent} />
      <span style={{ fontSize: 13, fontWeight: 820 }}>{complete ? label : action === "copy" ? "Copy" : "Paste"}</span>
    </div>
  );
}
