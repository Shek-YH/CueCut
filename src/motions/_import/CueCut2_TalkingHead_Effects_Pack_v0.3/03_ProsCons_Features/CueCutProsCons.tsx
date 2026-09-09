import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, easeOutCubic, segmentProgress } from "../00_shared/types";

export type CueCutProsConsProps = BaseEffectProps & {
  pros: string[];
  cons: string[];
  prosTitle?: string;
  consTitle?: string;
};

export function CueCutProsCons({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  pros,
  cons,
  prosTitle = "Pros",
  consTitle = "Cons",
}: CueCutProsConsProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const total = Math.max(pros.length, cons.length, 1);

  const column = (
    title: string,
    items: string[],
    positive: boolean
  ) => (
    <div
      style={{
        flex: 1,
        borderRadius: 20,
        padding: 20,
        background: "rgba(255,255,255,0.045)",
      }}
    >
      <div style={{ fontSize: 19, fontWeight: 850, color: positive ? tokens.positive : tokens.negative }}>
        {positive ? "✓ " : "× "}
        {title}
      </div>
      <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
        {items.map((item, i) => {
          const p = easeOutCubic(segmentProgress(progress, i, total));
          return (
            <div
              key={`${title}-${i}`}
              style={{
                fontSize: 15,
                lineHeight: 1.4,
                opacity: p,
                transform: `translateY(${(1 - p) * 10}px)`,
                color: tokens.text,
              }}
            >
              <span style={{ color: positive ? tokens.positive : tokens.negative, fontWeight: 900 }}>
                {positive ? "●" : "●"}
              </span>{" "}
              {item}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width: 760,
        borderRadius: 28,
        padding: 22,
        display: "flex",
        gap: 16,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        opacity: easeOutCubic(progress),
        ...style,
      }}
    >
      {column(prosTitle, pros, true)}
      {column(consTitle, cons, false)}
    </div>
  );
}
