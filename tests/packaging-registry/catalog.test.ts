import { describe, expect, it } from 'vitest';
import { packagingEffectCatalog, packagingCategoriesInCatalog } from '../../src/packaging-registry/catalog';

describe('V1 packaging registry catalog', () => {
  it('contains at least thirty licensed effects across eight categories', () => {
    expect(packagingEffectCatalog.length).toBeGreaterThanOrEqual(30);
    expect(packagingCategoriesInCatalog.size).toBeGreaterThanOrEqual(8);
    expect(packagingEffectCatalog.every((effect) => effect.licenseRef.length > 0)).toBe(true);
  });
});
