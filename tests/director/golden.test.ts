import { describe, expect, it } from 'vitest';
import { createEffectCapability, validateEffectContent } from '../../src/director/capabilities';
import { lintComposition } from '../../src/director/compositionLinter';
import { retrieveCandidatesForUnits } from '../../src/director/retriever';
import { createDirectorService } from '../../src/director/service';
import { planVisualUnits } from '../../src/director/semanticPlanner';
import type { EffectCapabilityCandidate } from '../../src/director/types';
import { createFixtureProject } from '../../src/project/fixtures';

const numeric = createEffectCapability({
  familyId: 'numeric', variantId: 'ring-a', displayName: '指标环 A', semanticTags: ['number'], contentSlots: ['label', 'value'], minDurationSec: 0.8, maxDurationSec: 8, supportedAspectRatios: ['16:9'], recommendedMotionCategories: [], recommendedSfxIntents: [],
});

const capability = (familyId: string, tags: string[]): EffectCapabilityCandidate => ({
  familyId, variantId: 'default', displayName: familyId, semanticTags: tags, contentSlots: ['text'], minDurationSec: 0.5, maxDurationSec: 8, supportedAspectRatios: ['16:9'], dataContract: { kind: 'text', requiredSlots: [], numericSlots: [], itemSlots: [], provenanceRequired: false },
});

describe('CueCut Director Golden regressions', () => {
  it('GOLDEN-001 preserves all four ordered process items with their source timing', () => {
    const plan = planVisualUnits([
      { id: 's1', startSec: 24, endSec: 30, text: '第一步，设定目标' },
      { id: 's2', startSec: 53, endSec: 59, text: '第二步，提取证据' },
      { id: 's3', startSec: 116, endSec: 122, text: '第三步，比较方案' },
      { id: 's4', startSec: 127, endSec: 133, text: '第四步，复盘结论' },
    ]);
    const unit = plan.units[0]!;

    expect(unit.semanticIntent).toBe('ordered_process');
    expect(unit.structure?.items).toHaveLength(4);
    expect(unit.structure?.items?.map((item) => item.startSec)).toEqual([24, 53, 116, 127]);
  });

  it('GOLDEN-002 rejects non-numeric text in a numeric capability', () => {
    expect(validateEffectContent(numeric, { label: '盲区定位', value: '盲区定位' })).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'numeric_value_required' }),
    ]));
  });

  it('GOLDEN-003 rejects an effect duration above its capability maximum', () => {
    const composition = createFixtureProject();
    composition.project.durationSec = 60;
    composition.effects = [composition.effects[0]!];
    composition.effects[0] = { ...composition.effects[0]!, time: { startSec: 0, endSec: 31 }, content: { label: '转化率', value: 92, provenance: { source: 'srt' } } };

    expect(lintComposition(composition, [numeric]).errors.map((error) => error.code)).toContain('duration_exceeds_capability');
  });

  it('GOLDEN-004 gives ordered process, quote, and comparison different candidate bundles', () => {
    const units = [
      { visualUnitId: 'process', sourceSubtitleIds: ['s1'], startSec: 0, endSec: 2, semanticIntent: 'ordered_process' as const, importance: 1, structure: { type: 'ordered_process' } },
      { visualUnitId: 'quote', sourceSubtitleIds: ['s2'], startSec: 2, endSec: 4, semanticIntent: 'quote' as const, importance: 0.8, structure: { type: 'quote' } },
      { visualUnitId: 'comparison', sourceSubtitleIds: ['s3'], startSec: 4, endSec: 6, semanticIntent: 'comparison' as const, importance: 0.8, structure: { type: 'comparison' } },
    ];
    const bundles = retrieveCandidatesForUnits(units, [capability('steps', ['steps', 'list']), capability('quote', ['quote']), capability('comparison', ['comparison'])], '16:9', 1);

    expect(bundles.map((bundle) => bundle.candidates[0]?.familyId)).toEqual(['steps', 'quote', 'comparison']);
  });

  it('GOLDEN-005 rejects a fabricated numeric provenance source', () => {
    expect(validateEffectContent(numeric, { value: 78, provenance: { source: 'model-inference' } })).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'provenance_source_invalid' }),
    ]));
  });

  it('GOLDEN-006 exposes provider fallback and never reports it as success', async () => {
    const service = createDirectorService(async () => { throw new Error('provider offline'); }, () => createFixtureProject());
    const result = await service.generate({});

    expect(result.usedFallback).toBe(true);
    expect(result.warnings).toContain('provider offline');
  });

  it('accepts a complete v2 Director result with capability, provenance, trace, and no fallback', async () => {
    const composition = createFixtureProject();
    composition.project.durationSec = 6;
    composition.effects = [{
      ...composition.effects[1]!,
      familyId: 'quote',
      variantId: 'default',
      segmentId: 'seg-1',
      time: { startSec: 0, endSec: 1 },
      content: { quoteText: '先做重要的事' },
    }];
    composition.segments = [{ ...composition.segments[0]!, sourceSubtitleIds: ['s-1'], startSec: 0, endSec: 1 }];
    const quote = createEffectCapability({
      familyId: 'quote', variantId: 'default', displayName: 'Quote', semanticTags: ['quote', 'text'], contentSlots: ['quoteText'], minDurationSec: 0.5, maxDurationSec: 8, supportedAspectRatios: ['16:9'], recommendedMotionCategories: [], recommendedSfxIntents: [],
    });
    const service = createDirectorService(async () => composition, () => createFixtureProject());

    const result = await service.generate({
      visualUnits: [{ visualUnitId: 'vu-s-1', sourceSubtitleIds: ['s-1'], startSec: 0, endSec: 1, semanticIntent: 'quote', importance: 0.8, structure: { type: 'quote' } }],
      effectCapabilities: [quote],
      selectionTrace: [{ visualUnitId: 'vu-s-1', semanticIntent: 'quote', retrievedCandidates: ['quote:default'], dataContractPassed: true, durationContractPassed: true }],
      candidateIndexes: { effects: [{ familyId: 'quote', variantId: 'default' }], motions: ['spring-in', 'scale-fade-out'], sfx: [] },
    });

    expect(result.usedFallback).toBe(false);
    expect(result.selectionTrace?.[0]).toMatchObject({ selected: 'quote:default', dataContractPassed: true, durationContractPassed: true });
    expect(result.lint?.ok).toBe(true);
  });
});
