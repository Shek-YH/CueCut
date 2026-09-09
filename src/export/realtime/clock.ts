import type { CaptureClockSample } from './types';

export interface CaptureClock {
  start(startMs: number): void;
  reset(): void;
  timeMsAt(nowMs: number): number;
  sample(nowMs: number, timelineTimeMs: number): CaptureClockSample;
  isComplete(nowMs: number): boolean;
}

export function frameTimeMs(frameIndex: number, fps: number): number {
  if (!Number.isInteger(frameIndex) || frameIndex < 0) throw new Error('frameIndex must be a non-negative integer');
  if (!Number.isFinite(fps) || fps <= 0) throw new Error('fps must be positive');
  return frameIndex * 1000 / fps;
}

export function createCaptureClock(options: { durationMs: number; fps: number }): CaptureClock {
  if (!Number.isFinite(options.durationMs) || options.durationMs <= 0) throw new Error('durationMs must be positive');
  if (!Number.isFinite(options.fps) || options.fps <= 0) throw new Error('fps must be positive');
  let startedAt: number | null = null;

  return {
    start(startMs) {
      if (!Number.isFinite(startMs)) throw new Error('startMs must be finite');
      startedAt = startMs;
    },
    reset() {
      startedAt = null;
    },
    timeMsAt(nowMs) {
      if (startedAt === null) return 0;
      return Math.min(options.durationMs, Math.max(0, nowMs - startedAt));
    },
    sample(nowMs, timelineTimeMs) {
      if (startedAt === null) throw new Error('Capture clock has not started');
      if (!Number.isFinite(nowMs) || !Number.isFinite(timelineTimeMs) || timelineTimeMs < 0) throw new Error('Capture clock sample must be finite and non-negative');
      const elapsedMs = nowMs - startedAt;
      if (elapsedMs < 0) throw new Error('Capture clock sample cannot move backwards');
      return { timelineTimeMs, elapsedMs, driftMs: timelineTimeMs - elapsedMs };
    },
    isComplete(nowMs) {
      return startedAt !== null && nowMs - startedAt >= options.durationMs;
    },
  };
}
