import { describe, expect, it } from 'vitest';
import { compileResolvedTimeline } from '../../src/packaging-timeline/compiler';

describe('packaging deterministic replay', () => {
  it('produces identical runtime timeline for identical plan, versions, and seed', () => {
    const input = { engineVersion: '1.0', registryVersion: '1.0', overlays: [{ id: 'o', effectId: 'e', startSec: 0, endSec: 2, rect: { x: 0.1, y: 0.1, width: 0.2, height: 0.1 }, content: {}, motion: { entrance: 'scale_punch' as const, emphasis: 'none' as const, exit: 'fade_out' as const }, seed: 42 }] };
    expect(compileResolvedTimeline(input)).toEqual(compileResolvedTimeline(input));
  });
});
