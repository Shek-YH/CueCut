import React from "react";
import { CueCutIcon } from "../00_shared/CueCutIcon";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, type IconName, easeOutCubic } from "../00_shared/types";

export type NotificationTone = "info" | "success" | "warning" | "error";

export type CueCutNotificationToastProps = BaseEffectProps & {
  title: string;
  message?: string;
  tone?: NotificationTone;
};

export function CueCutNotificationToast({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  title,
  message,
  tone = "info",
}: CueCutNotificationToastProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);

  const toneColor =
    tone === "success" ? tokens.positive :
    tone === "error" ? tokens.negative :
    tone === "warning" ? tokens.warning :
    tokens.accent;

  const icon: IconName =
    tone === "success" ? "check" :
    tone === "error" ? "x" :
    tone === "warning" ? "bell" :
    "bell";

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width: 520,
        borderRadius: 20,
        padding: 18,
        display: "grid",
        gridTemplateColumns: "44px 1fr",
        gap: 12,
        alignItems: "center",
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        opacity: p,
        transform: `translateX(${(1 - p) * 28}px)`,
        ...style,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 14,
          display: "grid",
          placeItems: "center",
          background: `${toneColor}20`,
          color: toneColor,
        }}
      >
        <CueCutIcon name={icon} size={23} color={toneColor} />
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 850 }}>{title}</div>
        {message ? (
          <div style={{ marginTop: 3, fontSize: 13, lineHeight: 1.4, color: tokens.muted }}>{message}</div>
        ) : null}
      </div>
    </div>
  );
}
