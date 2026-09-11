import { describe, expect, it } from 'vitest';
import { solvePackagingLayout } from '../../src/packaging-layout/solver';

describe('packaging layout solver', () => {
  it('uses the preferred zone unless blocked, then selects a deterministic fallback', () => {
    const result = solvePackagingLayout({
      preferredZones: ['upper-left', 'upper-right'], width: 0.3, height: 0.12,
      edgeInsets: { top: 0.04, bottom: 0.08, left: 0.05, right: 0.05 },
      blockedRects: [{ x: 0, y: 0, width: 0.5, height: 0.5 }],
    });
    expect(result.resolvedZone).toBe('upper-right');
    expect(result.fallbackUsed).toBe(true);
    expect(result.rect.x).toBeGreaterThan(0.5);
    expect(result.rect.y).toBeGreaterThanOrEqual(0.04);
  });
});
