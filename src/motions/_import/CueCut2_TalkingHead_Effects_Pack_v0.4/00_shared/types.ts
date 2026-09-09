import type { CSSProperties, ReactNode } from "react";

export type CueCutSkin = "minimal" | "glass" | "tech" | "soft";

export type BaseEffectProps = {
  /**
   * Normalized local effect progress in [0,1].
   * CueCut Timeline / frame renderer should drive this value.
   */
  progress: number;
  skin?: CueCutSkin;
  accentColor?: string;
  className?: string;
  style?: CSSProperties;
};

export type NormalizedCue = {
  start: number; // 0..1
  end: number;   // 0..1
};

export type CueWord = {
  id: string;
  text: string;
  cue?: NormalizedCue;
};

export type WithChildren = {
  children: ReactNode;
};

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

export const smoothstep = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};

export const localCueProgress = (
  progress: number,
  cue?: NormalizedCue,
  fallbackIndex = 0,
  fallbackCount = 1
) => {
  if (cue) {
    return clamp01((progress - cue.start) / Math.max(0.0001, cue.end - cue.start));
  }
  const segment = 1 / Math.max(1, fallbackCount);
  const start = fallbackIndex * segment;
  const end = start + segment;
  return clamp01((progress - start) / Math.max(0.0001, end - start));
};
