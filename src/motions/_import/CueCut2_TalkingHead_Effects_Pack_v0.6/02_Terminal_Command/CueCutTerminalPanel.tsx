import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { TrafficLights } from "../00_shared/window";
import { type BaseEffectProps, revealCount, easeOutCubic } from "../00_shared/types";

export type TerminalLine = {
  text: string;
  tone?: "command" | "output" | "success" | "error";
};

export type CueCutTerminalPanelProps = BaseEffectProps & {
  lines: TerminalLine[];
  title?: string;
  prompt?: string;
  width?: number;
  height?: number;
};

export function CueCutTerminalPanel({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  lines,
  title = "Terminal",
  prompt = "$",
  width = 760,
  height = 440,
}: CueCutTerminalPanelProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const count = revealCount(progress, lines.length);
  const p = easeOutCubic(progress);

  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius: 22,
        overflow: "hidden",
        background: "#05070d",
        border: `1px solid ${tokens.track}`,
        boxShadow: "0 22px 58px rgba(0,0,0,.34)",
        color: "#e5e7eb",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        opacity: p,
        transform: `scale(${0.98 + p * 0.02})`,
        ...style,
      }}
    >
      <div
        style={{
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 15px",
          borderBottom: "1px solid rgba(255,255,255,.08)",
          background: "#0b0e16",
        }}
      >
        <TrafficLights />
        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: "#94a3b8" }}>{title}</span>
        <span style={{ width: 46 }} />
      </div>
      <div style={{ padding: 20, fontSize: 15, lineHeight: 1.65 }}>
        {lines.slice(0, count).map((line, i) => {
          const color =
            line.tone === "success" ? "#34d399" :
            line.tone === "error" ? "#fb7185" :
            line.tone === "command" ? tokens.accent :
            "#cbd5e1";
          return (
            <div key={i} style={{ color, whiteSpace: "pre-wrap" }}>
              {line.tone === "command" ? `${prompt} ` : ""}{line.text}
            </div>
          );
        })}
        <span style={{ color: tokens.accent }}>▋</span>
      </div>
    </div>
  );
}
