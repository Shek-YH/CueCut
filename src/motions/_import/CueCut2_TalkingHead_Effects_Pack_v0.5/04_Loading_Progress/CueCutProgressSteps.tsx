import React from "react";
import { CueCutIcon } from "../00_shared/CueCutIcon";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, clamp01, easeOutCubic } from "../00_shared/types";

export type CueCutProgressStepsProps = BaseEffectProps & {
  steps: string[];
  completedText?: string;
};

export function CueCutProgressSteps({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  steps,
}: CueCutProgressStepsProps) {
  const tokens = getSkinTokens(skin, accentColor);

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width: 700,
        borderRadius: 24,
        padding: 22,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        display: "flex",
        alignItems: "center",
        gap: 10,
        ...style,
      }}
    >
      {steps.map((step, i) => {
        const threshold = (i + 1) / Math.max(1, steps.length);
        const local = easeOutCubic(clamp01(progress / threshold));
        const complete = progress >= threshold;

        return (
          <React.Fragment key={`${step}-${i}`}>
            <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  margin: "0 auto",
                  borderRadius: 999,
                  display: "grid",
                  placeItems: "center",
                  border: `2px solid ${complete ? tokens.positive : tokens.accent}`,
                  background: complete ? tokens.positive : `${tokens.accent}18`,
                  color: complete ? "#fff" : tokens.accent,
                  transform: `scale(${0.92 + local * 0.08})`,
                }}
              >
                {complete ? <CueCutIcon name="check" size={18} color="#fff" /> : i + 1}
              </div>
              <div style={{ marginTop: 7, fontSize: 11, fontWeight: 760, color: complete ? tokens.text : tokens.muted }}>
                {step}
              </div>
            </div>
            {i < steps.length - 1 ? (
              <div
                style={{
                  width: 34,
                  height: 3,
                  borderRadius: 999,
                  background: progress > threshold ? tokens.positive : tokens.track,
                  flex: "0 0 auto",
                }}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}
