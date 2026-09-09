import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { Sparkle } from "../00_shared/Sparkle";
import { type BaseEffectProps, easeOutCubic, segmentProgress } from "../00_shared/types";

export type FeatureItem = {
  id: string;
  title: string;
  description?: string;
  icon?: string;
};

export type CueCutFeatureGridProps = BaseEffectProps & {
  title?: string;
  items: FeatureItem[];
  columns?: 2 | 3;
};

export function CueCutFeatureGrid({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  title = "Highlights",
  items,
  columns = 2,
}: CueCutFeatureGridProps) {
  const tokens = getSkinTokens(skin, accentColor);

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width: columns === 3 ? 900 : 700,
        borderRadius: 28,
        padding: 24,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        opacity: easeOutCubic(progress),
        ...style,
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 850, marginBottom: 16 }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: 12 }}>
        {items.map((item, i) => {
          const p = easeOutCubic(segmentProgress(progress, i, items.length));
          return (
            <div
              key={item.id}
              style={{
                minHeight: 120,
                borderRadius: 18,
                padding: 17,
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${tokens.track}`,
                opacity: p,
                transform: `translateY(${(1 - p) * 12}px)`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 9, color: tokens.accent }}>
                {item.icon ? (
                  <span style={{ fontSize: 21 }}>{item.icon}</span>
                ) : (
                  <Sparkle size={18} color={tokens.accent} />
                )}
                <span style={{ fontSize: 17, fontWeight: 820, color: tokens.text }}>{item.title}</span>
              </div>
              {item.description ? (
                <div style={{ marginTop: 8, color: tokens.muted, fontSize: 13, lineHeight: 1.45 }}>
                  {item.description}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
