import type { CSSProperties } from "react";

export type CueCutSkin = "minimal" | "glass" | "tech" | "soft";

export type BaseEffectProps = {
  progress: number;
  skin?: CueCutSkin;
  accentColor?: string;
  className?: string;
  style?: CSSProperties;
};

export type XYDatum = {
  x: string | number;
  y: number;
};

export type NamedValue = {
  id: string;
  label: string;
  value: number;
  color?: string;
};

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export const easeOutCubic = (t: number) => {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
};

export const easeInOutCubic = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

export const localProgress = (
  progress: number,
  index: number,
  count: number
) => {
  const segment = 1 / Math.max(1, count);
  const start = index * segment * 0.78;
  const end = start + segment;
  return clamp01((progress - start) / Math.max(0.0001, end - start));
};
