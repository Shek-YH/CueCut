import { describe, expect, it } from 'vitest';
import { previewTimeForEffect } from '../../src/editor/selection/previewTime';

describe('previewTimeForEffect', () => {
  it('seeks five frames after the effect start when that frame is still valid', () => {
    expect(previewTimeForEffect({ startSec: 2.2, endSec: 7.8, fps: 30 })).toBeCloseTo(2.2 + 5 / 30);
  });

  it('keeps the preview at least one frame before the effect end', () => {
    expect(previewTimeForEffect({ startSec: 2.2, endSec: 2.35, fps: 30 })).toBeCloseTo(2.35 - 1 / 30);
  });

  it('never returns a preview time before the effect start for a sub-frame effect', () => {
    expect(previewTimeForEffect({ startSec: 2.2, endSec: 2.21, fps: 30 })).toBe(2.2);
  });
});
