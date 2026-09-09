import React from "react";
import { CueCutIcon } from "../00_shared/CueCutIcon";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, easeOutBack, easeOutCubic } from "../00_shared/types";

export type SocialActionType = "like" | "follow" | "subscribe";

export type CueCutSocialActionProps = BaseEffectProps & {
  action: SocialActionType;
  label?: string;
  completedLabel?: string;
  count?: string | number;
};

export function CueCutSocialAction({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  action,
  label,
  completedLabel,
  count,
}: CueCutSocialActionProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);
  const pop = easeOutBack(progress);
  const completed = progress > 0.68;

  const defaults = {
    like: ["Like", "Liked"],
    follow: ["Follow", "Following"],
    subscribe: ["Subscribe", "Subscribed"],
  } as const;

  const icon = action === "like" ? "heart" : action === "follow" ? "plus" : "bell";
  const initial = label ?? defaults[action][0];
  const done = completedLabel ?? defaults[action][1];

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        borderRadius: 999,
        padding: "10px 14px",
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        opacity: p,
        transform: `scale(${0.88 + pop * 0.12})`,
        ...style,
      }}
    >
      <span style={{ color: completed ? tokens.positive : tokens.accent, display: "grid" }}>
        <CueCutIcon
          name={completed && action !== "like" ? "check" : icon}
          size={24}
          color={completed ? tokens.positive : tokens.accent}
        />
      </span>
      <span style={{ fontSize: 14, fontWeight: 850 }}>{completed ? done : initial}</span>
      {count !== undefined ? (
        <span style={{ color: tokens.muted, fontSize: 12, fontWeight: 760 }}>{count}</span>
      ) : null}
    </div>
  );
}
