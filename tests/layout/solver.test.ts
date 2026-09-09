import { describe, expect, it } from 'vitest';
import { solveLayout, type NormalizedRect } from '../../src/layout/solver';

describe('Layout Solver', () => {
  it('moves an AI preferred rect to the nearest safe non-colliding coordinate', () => {
    const preferred: NormalizedRect = { nx: 0.1, ny: 0.1, nw: 0.3, nh: 0.2 };
    const result = solveLayout({
      preferred,
      safeMargin: 0.05,
      blocked: [{ nx: 0.05, ny: 0.05, nw: 0.4, nh: 0.3 }],
      importance: 0.5,
      manual: false,
      locked: false,
    });

    expect(result.manualOverride).toBe(false);
    expect(result.rect).not.toEqual(preferred);
    expect(result.rect.ny).toBeGreaterThan(0.3);
  });

  it('keeps a locked rect even when it overlaps another rect', () => {
    const preferred: NormalizedRect = { nx: 0.1, ny: 0.1, nw: 0.3, nh: 0.2 };
    const result = solveLayout({
      preferred,
      safeMargin: 0.05,
      blocked: [{ nx: 0.05, ny: 0.05, nw: 0.4, nh: 0.3 }],
      importance: 1,
      manual: true,
      locked: true,
    });

    expect(result.rect).toEqual(preferred);
    expect(result.manualOverride).toBe(true);
  });
});
