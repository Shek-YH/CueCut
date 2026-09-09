import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import {
  type BaseEffectProps,
  type CueCutTextItem,
  easeOutCubic,
  segmentProgress,
} from "../00_shared/types";

export type CueCutChecklistProps = BaseEffectProps & {
  title?: string;
  items: CueCutTextItem[];
  maxVisible?: number;
};

function CheckIcon({ amount, color }: { amount: number; color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="10"
        fill={amount > 0.92 ? color : "transparent"}
        stroke={color}
        strokeWidth="2"
        opacity={0.45 + amount * 0.55}
      />
      <path
        d="M7.2 12.3 10.4 15.4 16.8 8.8"
        fill="none"
        stroke={amount > 0.92 ? "#fff" : color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - amount}
      />
    </svg>
  );
}

export function CueCutChecklist({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  title = "Checklist",
  items,
  maxVisible = 6,
}: CueCutChecklistProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const visibleItems = items.slice(0, maxVisible);

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width: 520,
        borderRadius: 24,
        padding: 24,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        ...style,
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 760, marginBottom: 18 }}>
        {title}
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {visibleItems.map((item, index) => {
          const p = easeOutCubic(segmentProgress(progress, index, visibleItems.length));
          const checkP = Math.max(0, Math.min(1, (p - 0.55) / 0.45));
          return (
            <div
              key={item.id}
              style={{
                display: "grid",
                gridTemplateColumns: "32px 1fr",
                gap: 12,
                alignItems: "center",
                padding: "12px 14px",
                borderRadius: 16,
                background: p > 0.01 ? "rgba(255,255,255,0.055)" : "transparent",
                opacity: p,
                transform: `translateY(${(1 - p) * 14}px) scale(${0.97 + p * 0.03})`,
              }}
            >
              <CheckIcon amount={checkP} color={tokens.positive} />
              <div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 650,
                    textDecoration: checkP > 0.98 ? "line-through" : "none",
                    textDecorationColor: tokens.muted,
                  }}
                >
                  {item.text}
                </div>
                {item.subtext ? (
                  <div style={{ fontSize: 13, color: tokens.muted, marginTop: 3 }}>
                    {item.subtext}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
