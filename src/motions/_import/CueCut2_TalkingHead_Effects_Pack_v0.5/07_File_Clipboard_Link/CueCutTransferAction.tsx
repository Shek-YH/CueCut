import React from "react";
import { CueCutIcon } from "../00_shared/CueCutIcon";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, easeOutCubic } from "../00_shared/types";

export type TransferAction = "download" | "upload";

export type CueCutTransferActionProps = BaseEffectProps & {
  action: TransferAction;
  label?: string;
  percent?: number;
};

export function CueCutTransferAction({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  action,
  label,
  percent = 100,
}: CueCutTransferActionProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);
  const shown = Math.round(percent * p);

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width: 390,
        borderRadius: 20,
        padding: 16,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        opacity: p,
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <CueCutIcon name={action} size={22} color={tokens.accent} />
          <span style={{ fontSize: 13, fontWeight: 820 }}>
            {label ?? (action === "download" ? "Downloading" : "Uploading")}
          </span>
        </div>
        <span style={{ color: tokens.muted, fontSize: 12, fontWeight: 760 }}>{shown}%</span>
      </div>
      <div style={{ marginTop: 12, height: 8, borderRadius: 999, background: tokens.track, overflow: "hidden" }}>
        <div
          style={{
            width: `${shown}%`,
            height: "100%",
            borderRadius: 999,
            background: tokens.accent,
          }}
        />
      </div>
    </div>
  );
}
