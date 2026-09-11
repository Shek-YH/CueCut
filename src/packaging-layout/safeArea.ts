export interface NormalizedRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EdgeInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

const clamp = (value: number, min: number, max: number): number => Math.round(Math.max(min, Math.min(max, value)) * 1_000_000) / 1_000_000;

export function clampToEdgeInsets(rect: NormalizedRect, insets: EdgeInsets): NormalizedRect {
  return {
    ...rect,
    x: clamp(rect.x, insets.left, Math.max(insets.left, 1 - insets.right - rect.width)),
    y: clamp(rect.y, insets.top, Math.max(insets.top, 1 - insets.bottom - rect.height)),
  };
}
