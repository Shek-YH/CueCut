import { describe, expect, it } from 'vitest';
import { createCaptureClock, frameTimeMs } from '../../../src/export/realtime/clock';

describe('capture clock', () => {
  it('maps frame indexes to 30fps boundaries and clamps timeline time', () => {
    expect(frameTimeMs(0, 30)).toBe(0);
    expect(frameTimeMs(1, 30)).toBeCloseTo(1000 / 30, 6);
    expect(frameTimeMs(300, 30)).toBe(10000);

    const clock = createCaptureClock({ durationMs: 10000, fps: 30 });
    clock.start(500);
    expect(clock.timeMsAt(500)).toBe(0);
    expect(clock.timeMsAt(10500)).toBe(10000);
    expect(clock.isComplete(10500)).toBe(true);
  });

  it('reports drift relative to the monotonic capture elapsed time', () => {
    const clock = createCaptureClock({ durationMs: 10000, fps: 30 });
    clock.start(1000);
    expect(clock.sample(2030, 1000)).toEqual({ timelineTimeMs: 1000, elapsedMs: 1030, driftMs: -30 });
    expect(() => clock.sample(Number.NaN, 0)).toThrow(/finite/);
    expect(() => clock.sample(900, 0)).toThrow(/backwards/);
  });
});
