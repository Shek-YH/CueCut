import { describe, expect, it } from 'vitest';
import { canonicalPackagingCatalog, directorCatalogView } from '../../src/packaging-registry/canonicalCatalog';
import { packagingEffectCatalog } from '../../src/packaging-registry/catalog';
import { resolvePackagingEffect } from '../../src/packaging-registry/resolver';

describe('canonical packaging catalog', () => {
  it('derives resolver and Director views from one pack source', () => {
    expect(packagingEffectCatalog).toHaveLength(canonicalPackagingCatalog.length);
    expect(new Set(packagingEffectCatalog.map((effect) => effect.id))).toEqual(new Set(canonicalPackagingCatalog.map((entry) => entry.id.startsWith('cuecut-') ? entry.id : `cuecut-${entry.id}`)));
    expect(directorCatalogView[0]).toMatchObject({ id: canonicalPackagingCatalog[0]!.id, tags: expect.arrayContaining(canonicalPackagingCatalog[0]!.semanticTags) });
  });

  it('keeps a recently used candidate available with an explicit soft penalty', () => {
    const candidate = packagingEffectCatalog[0]!;
    const result = resolvePackagingEffect({
      category: candidate.category,
      visualStyle: 'clean-tech',
      energy: 0.5,
      subjectRelation: candidate.subjectRelations[0]!,
      preferredZones: candidate.supportedZones,
      aspectRatio: candidate.supportedAspectRatios[0]!,
      durationSec: candidate.duration.recommended,
      requiredContentSlots: [],
      excludeEffectIds: [candidate.id],
    }, [candidate]);

    expect(result.selected?.effect.id).toBe(candidate.id);
    expect(result.selected?.reasons).toContain('recent-use-penalty');
  });
});
