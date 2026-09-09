import type { CSSProperties, ReactNode } from "react";

export type CueCutSkin = "minimal" | "glass" | "tech" | "soft";

export type BaseEffectProps = {
  progress: number; // 0..1, driven by CueCut timeline/frame renderer
  skin?: CueCutSkin;
  accentColor?: string;
  className?: string;
  style?: CSSProperties;
};

export type IconName =
  | "check"
  | "x"
  | "heart"
  | "bell"
  | "download"
  | "upload"
  | "copy"
  | "link"
  | "mouse"
  | "cursor"
  | "spark"
  | "plus"
  | "arrow"
  | "command"
  | "keyboard";

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

export const pulse = (progress: number, cycles = 1) => {
  const p = clamp01(progress);
  return 0.5 - Math.cos(p * Math.PI * 2 * cycles) / 2;
};
