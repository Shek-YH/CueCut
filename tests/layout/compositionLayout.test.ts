import { describe, expect, it } from 'vitest';
import { createFixtureProject } from '../../src/project/fixtures';
import { resolveCompositionLayout } from '../../src/layout/compositionLayout';

describe('composition layout resolution', () => {
  it('moves an AI preferred effect away from available visual-context zones', () => {
    const composition = createFixtureProject();
    composition.effects = [composition.effects[0]!];
    composition.effects[0] = {
      ...composition.effects[0]!,
      layout: { ...composition.effects[0]!.layout, nx: 0.3, ny: 0.2, nw: 0.2, nh: 0.2 },
    };

    const result = resolveCompositionLayout(composition, {
      subjectZones: [],
      faceZones: [{ nx: 0.35, ny: 0.25, nw: 0.1, nh: 0.1 }],
      subtitleReservedZone: null,
      safeMargins: 0.05,
      faceZonesStatus: 'available',
      subjectZonesStatus: 'unavailable',
    });

    expect(result.effects[0]!.layout).not.toMatchObject({ nx: 0.3, ny: 0.2 });
    expect(result.effects[0]!.layout.nx + result.effects[0]!.layout.nw).toBeLessThanOrEqual(0.95);
  });

  it('shrinks an oversized preferred rect to fit the safe area', () => {
    const composition = createFixtureProject();
    composition.effects = [composition.effects[0]!];
    composition.effects[0] = {
      ...composition.effects[0]!,
      layout: { ...composition.effects[0]!.layout, nx: 0.4, ny: 0.2, nw: 0.95, nh: 0.95 },
    };

    const result = resolveCompositionLayout(composition, {
      subjectZones: [],
      faceZones: [],
      subtitleReservedZone: null,
      safeMargins: 0.05,
    });

    expect(result.effects[0]!.layout.nw).toBeLessThanOrEqual(0.9);
    expect(result.effects[0]!.layout.nh).toBeLessThanOrEqual(0.9);
    expect(result.effects[0]!.layout.nx + result.effects[0]!.layout.nw).toBeCloseTo(0.95, 5);
    expect(result.effects[0]!.layout.ny + result.effects[0]!.layout.nh).toBeCloseTo(0.95, 5);
  });
});
