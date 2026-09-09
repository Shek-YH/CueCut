import React from "react";
import { CueCutIcon } from "../00_shared/CueCutIcon";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, clamp01, easeOutCubic } from "../00_shared/types";

export type CueCutKeyboardShortcutProps = BaseEffectProps & {
  keys: string[];
  label?: string;
  pressAt?: number;
};

export function CueCutKeyboardShortcut({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  keys,
  label,
  pressAt = 0.55,
}: CueCutKeyboardShortcutProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeOutCubic(progress);
  const pressed = progress >= pressAt;

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        display: "inline-flex",
        flexDirection: "column",
        gap: 10,
        borderRadius: 22,
        padding: 16,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        opacity: p,
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <CueCutIcon name="keyboard" size={22} color={tokens.accent} />
        {keys.map((key, i) => (
          <React.Fragment key={`${key}-${i}`}>
            <div
              style={{
                minWidth: 42,
                height: 38,
                padding: "0 10px",
                borderRadius: 10,
                display: "grid",
                placeItems: "center",
                border: `1px solid ${pressed ? tokens.accent : tokens.track}`,
                background: pressed ? `${tokens.accent}20` : tokens.surface,
                color: pressed ? tokens.accent : tokens.text,
                fontSize: 13,
                fontWeight: 900,
                transform: `translateY(${pressed ? 2 : 0}px)`,
                boxShadow: pressed ? "none" : "0 4px 0 rgba(0,0,0,.22)",
              }}
            >
              {key}
            </div>
            {i < keys.length - 1 ? (
              <span style={{ color: tokens.muted, fontSize: 13, fontWeight: 800 }}>+</span>
            ) : null}
          </React.Fragment>
        ))}
      </div>
      {label ? (
        <div style={{ color: tokens.muted, fontSize: 12, textAlign: "center", fontWeight: 720 }}>{label}</div>
      ) : null}
    </div>
  );
}
