import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, clamp01, easeInOutCubic } from "../00_shared/types";

export type CueCutBeforeAfterSplitProps = BaseEffectProps & {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
  width?: number;
  height?: number;
};

export function CueCutBeforeAfterSplit({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  beforeSrc,
  afterSrc,
  beforeLabel = "Before",
  afterLabel = "After",
  width = 680,
  height = 420,
}: CueCutBeforeAfterSplitProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const p = easeInOutCubic(clamp01(progress));
  const split = 12 + p * 76;

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width: width + 32,
        padding: 16,
        borderRadius: 26,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        ...style,
      }}
    >
      <div style={{ position: "relative", width, height, overflow: "hidden", borderRadius: 18 }}>
        <img src={beforeSrc} alt={beforeLabel} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        <img
          src={afterSrc}
          alt={afterLabel}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            clipPath: `inset(0 0 0 ${split}%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${split}%`,
            width: 3,
            background: tokens.accent,
            boxShadow: `0 0 18px ${tokens.accent}`,
          }}
        />
        <div style={{ position: "absolute", left: 14, top: 14, padding: "7px 10px", borderRadius: 10, background: "rgba(0,0,0,.55)", fontWeight: 700 }}>
          {beforeLabel}
        </div>
        <div style={{ position: "absolute", right: 14, top: 14, padding: "7px 10px", borderRadius: 10, background: "rgba(0,0,0,.55)", fontWeight: 700 }}>
          {afterLabel}
        </div>
      </div>
    </div>
  );
}
