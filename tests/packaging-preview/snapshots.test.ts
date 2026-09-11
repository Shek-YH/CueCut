import { describe, expect, it } from 'vitest';
import { createPackagingSnapshotPlan } from '../../src/packaging-preview/snapshots';

describe('packaging snapshot QA plan', () => {
  it('samples opening, signature, peak, final, and long-video checkpoints', () => {
    const result = createPackagingSnapshotPlan({
      durationSec: 240,
      overlays: [
        { id: 'a', startSec: 10, endSec: 30, importance: 0.4 },
        { id: 'hero', startSec: 100, endSec: 140, importance: 0.95 },
      ],
    });
    expect(result.times).toEqual(expect.arrayContaining([0, 60, 120, 180, 240, 104, 120, 136]));
    expect(result.overlaySamples).toEqual(expect.arrayContaining([{ overlayId: 'hero', timeSec: 104 }, { overlayId: 'hero', timeSec: 120 }, { overlayId: 'hero', timeSec: 136 }]));
  });
});
