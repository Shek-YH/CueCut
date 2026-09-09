import { describe, expect, it } from 'vitest';
import {
  effectRegistry,
  findEffectDefinition,
  isKnownEffectCandidate,
  migrateVariantContent,
} from '../../src/effects/registry';

describe('Effect Registry', () => {
  it('looks up only registered family and variant pairs', () => {
    expect(effectRegistry.length).toBeGreaterThanOrEqual(10);
    expect(findEffectDefinition('numeric', 'ring-a')?.familyId).toBe('numeric');
    expect(isKnownEffectCandidate('numeric', 'ring-a')).toBe(true);
    expect(isKnownEffectCandidate('numeric', 'invented-variant')).toBe(false);
  });

  it('preserves family content while caching incompatible variant state', () => {
    const migrated = migrateVariantContent({
      familyId: 'numeric',
      fromVariantId: 'ring-a',
      toVariantId: 'ring-b',
      content: { label: '比例指标', value: '92.4', maximum: '100', decimals: 1 },
      variantStateCache: {},
    });

    expect(migrated.content).toEqual({
      label: '比例指标',
      value: '92.4',
      maximum: '100',
      decimals: 1,
    });
    expect(migrated.variantStateCache['ring-a']).toEqual({
      label: '比例指标',
      value: '92.4',
      maximum: '100',
      decimals: 1,
    });
  });
});

