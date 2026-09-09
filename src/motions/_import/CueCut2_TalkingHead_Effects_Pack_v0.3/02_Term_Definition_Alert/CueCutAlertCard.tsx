import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, easeOutBack, easeOutCubic } from "../00_shared/types";

export type AlertLevel = "info" | "success" | "warning" | "error";

export type CueCutAlertCardProps = BaseEffectProps & {
  title: string;
  message?: string;
  level?: AlertLevel;
};

const symbolMap: Record<AlertLevel, string> = {
  info: "i",
  success: "✓",
  warning: "!",
  error: "×",
};

export function CueCutAlertCard({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  title,
  message,
  level = "warning",
}: CueCutAlertCardProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);
  const pop = easeOutBack(progress);
  const tone =
    level === "success"
      ? tokens.positive
      : level === "error"
      ? tokens.negative
      : level === "warning"
      ? tokens.warning
      : tokens.accent;

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width: 600,
        borderRadius: 24,
        padding: 22,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        borderLeft: `6px solid ${tone}`,
        opacity: p,
        transform: `scale(${0.94 + pop * 0.06})`,
        ...style,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "46px 1fr", gap: 14, alignItems: "center" }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            display: "grid",
            placeItems: "center",
            background: tone,
            color: "#fff",
            fontWeight: 950,
            fontSize: 23,
          }}
        >
          {symbolMap[level]}
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 850 }}>{title}</div>
          {message ? (
            <div style={{ marginTop: 4, color: tokens.muted, fontSize: 15, lineHeight: 1.45 }}>
              {message}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
