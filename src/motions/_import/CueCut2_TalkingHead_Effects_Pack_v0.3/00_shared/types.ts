import type { CSSProperties } from "react";

export type CueCutSkin = "minimal" | "glass" | "tech" | "soft";

export type BaseEffectProps = {
  /**
   * Normalized local effect progress in [0,1].
   * Drive this from CueCut's Timeline / frame renderer.
   */
  progress: number;
  skin?: CueCutSkin;
  accentColor?: string;
  className?: string;
  style?: CSSProperties;
};

export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export const easeOutCubic = (t: number) => {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
};

export const easeOutBack = (t: number) => {
  const x = clamp01(t);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

export const segmentProgress = (
  progress: number,
  index: number,
  count: number,
  overlap = 0.14
) => {
  if (count <= 0) return 0;
  const segment = 1 / count;
  const start = index * segment * (1 - overlap);
  const end = start + segment;
  return clamp01((progress - start) / Math.max(0.0001, end - start));
};
