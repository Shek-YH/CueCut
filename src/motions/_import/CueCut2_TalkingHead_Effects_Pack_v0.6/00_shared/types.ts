import type { CSSProperties, ReactNode } from "react";

export type CueCutSkin = "minimal" | "glass" | "tech" | "soft";

export type BaseEffectProps = {
  progress: number; // 0..1
  skin?: CueCutSkin;
  accentColor?: string;
  className?: string;
  style?: CSSProperties;
};

export type WithChildren = { children: ReactNode };

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

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

export const revealCount = (progress: number, total: number) =>
  Math.max(0, Math.min(total, Math.ceil(clamp01(progress) * total)));

export const typeByProgress = (text: string, progress: number) =>
  text.slice(0, Math.floor(clamp01(progress) * text.length));
