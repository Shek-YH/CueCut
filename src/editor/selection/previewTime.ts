interface PreviewTimeForEffectInput {
  startSec: number;
  endSec: number;
  fps: number;
}

export function previewTimeForEffect({ startSec, endSec, fps }: PreviewTimeForEffectInput): number {
  return Math.min(startSec + 5 / fps, endSec - 1 / fps);
}
