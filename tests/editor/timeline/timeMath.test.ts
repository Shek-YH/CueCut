import { describe, expect, it } from 'vitest';
import { clampEffectMove, clampEffectTrim, secondsFromTimelineX } from '../../../src/editor/timeline/timeMath';

describe('timeline time math', () => {
  it('maps timeline pixels to seconds and clamps the playhead', () => {
    expect(secondsFromTimelineX({ clientX: 250, left: 100, width: 300, durationSec: 30 })).toBe(15);
    expect(secondsFromTimelineX({ clientX: 50, left: 100, width: 300, durationSec: 30 })).toBe(0);
    expect(secondsFromTimelineX({ clientX: 500, left: 100, width: 300, durationSec: 30 })).toBe(30);
  });

  it('moves an effect without changing its duration or the playhead', () => {
    const result = clampEffectMove({ startSec: 5, endSec: 10, deltaSec: 4, durationSec: 30 });

    expect(result).toEqual({ startSec: 9, endSec: 14 });
  });

  it('trims an effect without crossing its minimum duration', () => {
    expect(clampEffectTrim({ startSec: 5, endSec: 10, edge: 'start', deltaSec: 8, minimumDurationSec: 1 })).toEqual({
      startSec: 9,
      endSec: 10,
    });
    expect(clampEffectTrim({ startSec: 5, endSec: 10, edge: 'end', deltaSec: -8, minimumDurationSec: 1 })).toEqual({
      startSec: 5,
      endSec: 6,
    });
  });
});

