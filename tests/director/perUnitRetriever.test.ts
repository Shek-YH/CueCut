import { describe, expect, it } from 'vitest';
import { retrieveCandidatesForUnits } from '../../src/director/retriever';
import type { EffectCapabilityCandidate, VisualUnit } from '../../src/director/types';

const candidate = (familyId: string, tags: string[], useCases: string[] = []): EffectCapabilityCandidate => ({
  familyId,
  variantId: 'default',
  displayName: familyId,
  semanticTags: tags,
  contentSlots: ['text'],
  minDurationSec: 0.5,
  maxDurationSec: 8,
  supportedAspectRatios: ['16:9'],
  useCases,
  dataContract: { kind: 'text', requiredSlots: [], numericSlots: [], itemSlots: [], provenanceRequired: false },
});

describe('Director per-VisualUnit retriever', () => {
  it('returns different bounded candidate bundles for different semantic units', () => {
    const units: VisualUnit[] = [
      { visualUnitId: 'vu-process', sourceSubtitleIds: ['s-1'], startSec: 0, endSec: 5, semanticIntent: 'ordered_process', importance: 1, structure: { type: 'ordered_process' } },
      { visualUnitId: 'vu-quote', sourceSubtitleIds: ['s-2'], startSec: 5, endSec: 8, semanticIntent: 'quote', importance: 0.7, structure: { type: 'quote' } },
      { visualUnitId: 'vu-compare', sourceSubtitleIds: ['s-3'], startSec: 8, endSec: 12, semanticIntent: 'comparison', importance: 0.8, structure: { type: 'comparison' } },
    ];
    const result = retrieveCandidatesForUnits(units, [
      candidate('process', ['list', 'steps'], ['Steps', 'Checklist']),
      candidate('quote', ['quote', 'text'], ['Quote']),
      candidate('comparison', ['comparison', 'text'], ['Comparison']),
      candidate('neutral', ['text']),
    ], '16:9', 2);

    expect(result).toHaveLength(3);
    expect(result.map((bundle) => bundle.visualUnitId)).toEqual(['vu-process', 'vu-quote', 'vu-compare']);
    expect(result.map((bundle) => bundle.candidates[0]?.familyId)).toEqual(['process', 'quote', 'comparison']);
    expect(new Set(result.map((bundle) => bundle.candidates.map((item) => item.familyId).join(','))).size).toBeGreaterThan(1);
  });
});
