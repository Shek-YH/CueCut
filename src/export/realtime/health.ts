import type { CaptureHealthStats, CaptureHealthStatus } from './types';

interface FrameSample {
  frameIndex: number;
  timelineTimeMs: number;
  wallClockMs: number;
}

export function createCaptureHealthMonitor(options: { fps: number; durationMs: number; manualFrameSubmission?: boolean }) {
  if (!Number.isFinite(options.fps) || options.fps <= 0) throw new Error('fps must be positive');
  if (!Number.isFinite(options.durationMs) || options.durationMs <= 0) throw new Error('durationMs must be positive');
  const samples: FrameSample[] = [];
  let driftTotal = 0;
  let maxDrift = 0;
  let droppedFrames = 0;
  const expectedInterval = 1000 / options.fps;

  return {
    recordFrame(sample: FrameSample): void {
      if (!Number.isInteger(sample.frameIndex) || sample.frameIndex < 0 || !Number.isFinite(sample.timelineTimeMs) || sample.timelineTimeMs < 0 || !Number.isFinite(sample.wallClockMs)) {
        throw new Error('Capture frame sample is invalid');
      }
      const previous = samples.at(-1);
      if (previous && (sample.frameIndex <= previous.frameIndex || sample.wallClockMs < previous.wallClockMs)) throw new Error('Capture frame samples must be monotonic');
      if (previous) {
        const wallDelta = sample.wallClockMs - previous.wallClockMs;
        if (!options.manualFrameSubmission && wallDelta > expectedInterval * 1.5) droppedFrames += Math.max(1, Math.round(wallDelta / expectedInterval) - 1);
      }
      const expectedTime = sample.frameIndex * expectedInterval;
      const drift = sample.timelineTimeMs - expectedTime;
      driftTotal += Math.abs(drift);
      maxDrift = Math.max(maxDrift, Math.abs(drift));
      samples.push(sample);
    },
    finish(endWallClockMs: number, finishOptions: { timelineDurationMs?: number; fileSizeBytes?: number; warnings?: string[]; errors?: string[] } = {}): CaptureHealthStats {
      if (!Number.isFinite(endWallClockMs)) throw new Error('endWallClockMs must be finite');
      const first = samples[0];
      const last = samples.at(-1);
      const wallClockMs = first ? Math.max(0, endWallClockMs - first.wallClockMs) : 0;
      const actualFps = wallClockMs > 0 ? samples.length / (wallClockMs / 1000) : 0;
      const finalDriftMs = last ? last.timelineTimeMs - last.frameIndex * expectedInterval : 0;
      const timelineDurationMs = finishOptions.timelineDurationMs ?? last?.timelineTimeMs ?? 0;
      const durationMismatch = Math.abs(timelineDurationMs - options.durationMs);
      const frameCountMismatch = Math.max(0, Math.round(options.durationMs / expectedInterval) - samples.length);
      const warnings = [...(finishOptions.warnings ?? [])];
      const errors = [...(finishOptions.errors ?? [])];
      if (durationMismatch > expectedInterval || frameCountMismatch > 1) errors.push('CAPTURE_DURATION_MISMATCH');
      const status: CaptureHealthStatus = errors.length > 0 ? 'FAILED' : (droppedFrames > 0 || maxDrift > expectedInterval ? 'WARNING' : 'HEALTHY');
      return {
        expectedFps: options.fps,
        actualFps,
        expectedFrames: Math.round(options.durationMs / 1000 * options.fps),
        observedFrames: samples.length,
        droppedFrames,
        averageDriftMs: samples.length ? driftTotal / samples.length : 0,
        maxDriftMs: maxDrift,
        finalDriftMs,
        wallClockMs,
        recordingDurationMs: wallClockMs,
        timelineDurationMs,
        fileSizeBytes: finishOptions.fileSizeBytes ?? null,
        warnings,
        errors,
        status,
      };
    },
  };
}
