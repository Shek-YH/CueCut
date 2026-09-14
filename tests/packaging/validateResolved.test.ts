import { describe, expect, it } from 'vitest';
import { validateResolvedPackagingPlan } from '../../src/packaging/validateResolved';

const overlay = { id: 'overlay-1', startSec: 1, endSec: 3, rect: { x: 0.1, y: 0.1, width: 0.3, height: 0.2 }, content: { text: 'claim' }, importance: 0.8 };

describe('resolved packaging validation', () => {
  it('accepts a valid resolved overlay and catches invalid timing/edge data', () => {
    expect(validateResolvedPackagingPlan({ durationSec: 4, maxConcurrentOverlays: 2, overlays: [overlay] }).valid).toBe(true);
    const invalid = validateResolvedPackagingPlan({ durationSec: 2, maxConcurrentOverlays: 2, overlays: [{ ...overlay, endSec: 3, rect: { ...overlay.rect, x: 0.8 } }] });

    expect(invalid.valid).toBe(false);
    expect(invalid.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining(['timing', 'edge']));
  });
});
