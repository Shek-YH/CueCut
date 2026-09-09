import { describe, expect, it } from 'vitest';
import { createCaptureHealthMonitor } from '../../../src/export/realtime/health';

describe('capture health monitor', () => {
  it('counts observed frames and potential dropped frames from frame gaps', () => {
    const monitor = createCaptureHealthMonitor({ fps: 30, durationMs: 1000 });
    monitor.recordFrame({ frameIndex: 0, timelineTimeMs: 0, wallClockMs: 0 });
    monitor.recordFrame({ frameIndex: 1, timelineTimeMs: 1000 / 30, wallClockMs: 1000 / 30 });
    monitor.recordFrame({ frameIndex: 4, timelineTimeMs: 4000 / 30, wallClockMs: 4000 / 30 });
    const stats = monitor.finish(1033.333, { timelineDurationMs: 1000, fileSizeBytes: 24 });

    expect(stats.expectedFrames).toBe(30);
    expect(stats.observedFrames).toBe(3);
    expect(stats.droppedFrames).toBe(2);
    expect(stats.actualFps).toBeCloseTo(2.9, 1);
    expect(stats.maxDriftMs).toBe(0);
    expect(stats.recordingDurationMs).toBeCloseTo(1033.333, 3);
    expect(stats.timelineDurationMs).toBe(1000);
    expect(stats.fileSizeBytes).toBe(24);
    expect(stats.status).toBe('FAILED');
  });

  it('marks a steady one-frame capture healthy when drift is within one frame', () => {
    const monitor = createCaptureHealthMonitor({ fps: 30, durationMs: 100 });
    monitor.recordFrame({ frameIndex: 0, timelineTimeMs: 0, wallClockMs: 0 });
    monitor.recordFrame({ frameIndex: 1, timelineTimeMs: 34, wallClockMs: 34 });
    const stats = monitor.finish(100, { timelineDurationMs: 100 });
    expect(stats.droppedFrames).toBe(0);
    expect(stats.status).toBe('HEALTHY');
  });

  it('uses warning status for a small dropped-frame gap and rejects invalid samples', () => {
    const monitor = createCaptureHealthMonitor({ fps: 30, durationMs: 100 });
    monitor.recordFrame({ frameIndex: 0, timelineTimeMs: 0, wallClockMs: 0 });
    monitor.recordFrame({ frameIndex: 1, timelineTimeMs: 1000 / 30, wallClockMs: 70 });
    expect(monitor.finish(100, { timelineDurationMs: 100 }).status).toBe('WARNING');
    expect(() => monitor.recordFrame({ frameIndex: 1, timelineTimeMs: Number.NaN, wallClockMs: 80 })).toThrow(/invalid|monotonic/i);
  });
});
