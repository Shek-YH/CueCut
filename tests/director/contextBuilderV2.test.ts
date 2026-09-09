import { describe, expect, it } from 'vitest';
import { buildDirectorInputV2 } from '../../src/director/contextBuilder';
import type { EffectDefinition } from '../../src/effects/registry';

const effect = (familyId: string, tags: string[], useCases: string[] = []): EffectDefinition => ({
  familyId,
  variantId: 'default',
  displayName: familyId,
  semanticTags: tags,
  contentSlots: tags.includes('steps') ? ['items'] : ['text'],
  minDurationSec: 0.5,
  maxDurationSec: 8,
  supportedAspectRatios: ['16:9'],
  recommendedMotionCategories: [],
  recommendedSfxIntents: [],
  useCases,
});

describe('Director v2 context builder', () => {
  it('builds unit-scoped capability bundles and retains the full transcript', () => {
    const result = buildDirectorInputV2({
      project: { projectId: 'v2', durationSec: 12, fps: 30, canvasWidth: 1920, canvasHeight: 1080, aspectRatio: '16:9' },
      transcript: [
        { id: 's-1', startSec: 0, endSec: 2, text: '第一步，建立目标' },
        { id: 's-2', startSec: 2, endSec: 4, text: '第二步，验证结果' },
        { id: 's-3', startSec: 4, endSec: 6, text: '有人说，先做重要的事' },
      ],
      visualContext: { subjectZones: [], faceZones: [], subtitleReservedZone: null, safeMargins: 0.05 },
      effects: [
        effect('process', ['list', 'steps'], ['Steps']),
        effect('quote', ['quote', 'text'], ['Quote']),
        effect('neutral', ['text']),
      ],
      motions: [],
      sfx: [],
      preferences: {},
    });

    expect(result.visualUnits).toHaveLength(2);
    expect(result.candidateBundles).toHaveLength(2);
    expect(result.candidateBundles.map((bundle) => bundle.visualUnitId)).toEqual(['vu-s-1', 'vu-s-3']);
    expect(result.candidateBundles[0]?.candidates[0]).toMatchObject({ familyId: 'process', dataContract: { kind: 'steps' } });
    expect(result.candidateBundles[1]?.candidates[0]).toMatchObject({ familyId: 'quote' });
    expect(result.transcript).toHaveLength(3);
  });
});
