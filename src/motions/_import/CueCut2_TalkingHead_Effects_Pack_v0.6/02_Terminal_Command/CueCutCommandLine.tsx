import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, typeByProgress, easeOutCubic } from "../00_shared/types";

export type CueCutCommandLineProps = BaseEffectProps & {
  command: string;
  prompt?: string;
  label?: string;
};

export function CueCutCommandLine({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  command,
  prompt = "$",
  label,
}: CueCutCommandLineProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);
  const typed = typeByProgress(command, progress);

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        display: "inline-flex",
        flexDirection: "column",
        gap: 8,
        borderRadius: 18,
        padding: 15,
        color: tokens.text,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        opacity: p,
        ...style,
      }}
    >
      {label ? <div style={{ color: tokens.muted, fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 800 }}>{label}</div> : null}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: tokens.accent, fontWeight: 900 }}>{prompt}</span>
        <span style={{ fontSize: 15, fontWeight: 650 }}>{typed}</span>
        <span style={{ color: tokens.accent }}>▋</span>
      </div>
    </div>
  );
}
