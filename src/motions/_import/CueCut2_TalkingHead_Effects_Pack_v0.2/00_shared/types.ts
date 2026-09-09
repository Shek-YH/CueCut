import type { CSSProperties } from "react";

export type CueCutSkin = "minimal" | "glass" | "tech" | "soft";

export type BaseEffectProps = {
  /**
   * Normalized local effect progress in [0, 1].
   * Prefer driving this from CueCut's frame/timeline engine instead of timers.
   */
  progress: number;
  skin?: CueCutSkin;
  accentColor?: string;
  className?: string;
  style?: CSSProperties;
};

export type CueCutTextItem = {
  id: string;
  text: string;
  subtext?: string;
};

export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export const segmentProgress = (
  progress: number,
  index: number,
  count: number,
  overlap = 0.18
) => {
  if (count <= 0) return 0;
  const segment = 1 / count;
  const start = index * segment * (1 - overlap);
  const end = start + segment;
  return clamp01((progress - start) / Math.max(0.0001, end - start));
};

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);

export const easeInOutCubic = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
