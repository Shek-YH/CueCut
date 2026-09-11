import { describe, expect, it } from 'vitest';
import { packagingEffectCatalog } from '../../src/packaging-registry/catalog';
import { findPackMotion } from '../../src/motions/packCatalog';
import { resolvePackagingEffect, registryScoreWeights } from '../../src/packaging-registry/resolver';
import type { PackagingEffectManifest } from '../../src/packaging-registry/manifest';

function testManifest(id: string, metadata: Record<string, unknown>): PackagingEffectManifest {
  return {
    id,
    version: '1.0.0',
    category: 'transition',
    title: id,
    tags: ['base'],
    supportedAspectRatios: ['16:9'],
    supportedZones: ['upper-left'],
    subjectRelations: ['avoid'],
    duration: { min: 1, recommended: 4, max: 12 },
    motionCapabilities: { entrance: ['fade_in'], emphasis: ['none'], exit: ['fade_out'] },
    contentSchema: { items: 'string' },
    safeZoneAware: true,
    subtitleAware: true,
    subjectAware: true,
    runtime: 'canvas',
    license: 'PROJECT-LOCAL',
    licenseRef: 'test',
    ...metadata,
  } as PackagingEffectManifest;
}

describe('packaging registry resolver', () => {
  it('selects a deterministic capability match and exposes fallback candidates', () => {
    const result = resolvePackagingEffect({
      category: 'stat', visualStyle: 'KPI', energy: 0.5, subjectRelation: 'avoid', preferredZones: ['center'], aspectRatio: '9:16', durationSec: 2, requiredContentSlots: ['value'],
    });
    expect(result.selected).toBeDefined();
    expect(result.candidates.length).toBeGreaterThan(1);
    expect(result.candidates[0]!.score).toBeGreaterThanOrEqual(result.candidates[1]!.score);
    expect(result.candidates[0]!.effect.category).toBe('stat');
  });

  it('uses the PRD score weights', () => {
    expect(registryScoreWeights).toEqual({ category: 30, style: 15, aspectRatio: 15, zone: 10, subjectRelation: 10, duration: 10, contentSchema: 10 });
  });

  it('can select a different registered variant when the top candidate was already used', () => {
    const request = { category: 'callout' as const, visualStyle: 'clean-tech', energy: 0.5, subjectRelation: 'avoid' as const, preferredZones: ['upper-left'] as const, aspectRatio: '16:9', durationSec: 3, requiredContentSlots: ['headline'] };
    const first = resolvePackagingEffect(request);
    const second = resolvePackagingEffect({ ...request, excludeEffectIds: first.selected ? [first.selected.effect.id] : [] });

    expect(first.selected).toBeDefined();
    expect(second.selected).toBeDefined();
    expect(second.selected?.effect.id).not.toBe(first.selected?.effect.id);
  });

  it('uses template query tags and semantic role to select a matching catalog effect', () => {
    const catalog = [
      testManifest('real-generic', { semanticRoles: ['neutral'], visualIntents: ['static-card'], tags: ['base'] }),
      testManifest('real-step-template', { semanticRoles: ['ordered-process'], visualIntents: ['progressive-explanation'], tags: ['base', 'steps'], itemCountRange: [2, 6], persistenceModes: ['section'], supportsCueTimes: true }),
    ];
    const request = { category: 'transition' as const, visualStyle: 'base', energy: 0.5, subjectRelation: 'avoid' as const, preferredZones: ['upper-left'] as const, aspectRatio: '16:9', durationSec: 10, requiredContentSlots: ['items'] };

    const result = resolvePackagingEffect({ ...request, templateQuery: { semanticRole: 'ordered-process', visualIntent: 'progressive-explanation', tags: ['steps'], requiredContentSlots: ['items'], itemCount: 4, durationRangeSec: [8, 60], preferredZones: ['upper-left'], persistence: 'section' } }, catalog);

    expect(result.selected?.effect.id).toBe('real-step-template');
    expect(result.selected?.reasons).toEqual(expect.arrayContaining(['semanticRole', 'visualIntent', 'tags', 'itemCount', 'durationRangeSec', 'persistence']));
    expect(result.selected?.score).toBeGreaterThan(result.candidates.find((candidate) => candidate.effect.id === 'real-generic')!.score);
  });

  it('ignores unknown AI template hints and only returns effects from the supplied catalog', () => {
    const catalog = [testManifest('real-effect', { semanticRoles: ['neutral'] })];
    const result = resolvePackagingEffect({
      category: 'transition', visualStyle: 'base', energy: 0.5, subjectRelation: 'avoid', preferredZones: ['upper-left'], aspectRatio: '16:9', durationSec: 2, requiredContentSlots: [],
      effectId: 'unknown-ai-template',
      templateId: 'unknown-template-id',
      templateQuery: { tags: ['unknown'] },
    }, catalog);

    expect(result.selected?.effect.id).toBe('real-effect');
    expect(result.candidates.map((candidate) => candidate.effect.id)).toEqual(['real-effect']);
  });

  it('continues to resolve old requests without a template query', () => {
    const result = resolvePackagingEffect({ category: 'stat', visualStyle: 'KPI', energy: 0.5, subjectRelation: 'avoid', preferredZones: ['center'], aspectRatio: '9:16', durationSec: 2, requiredContentSlots: ['value'] });
    expect(result.selected).toBeDefined();
    expect(packagingEffectCatalog).toContainEqual(result.selected!.effect);
  });

  it('keeps catalog ids canonical and directly resolvable by the motion catalog', () => {
    expect(packagingEffectCatalog.every((effect) => !effect.id.startsWith('cuecut-cuecut-'))).toBe(true);
    expect(packagingEffectCatalog.every((effect) => findPackMotion(effect.id))).toBe(true);
  });
});
