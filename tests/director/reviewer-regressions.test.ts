import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseSrt } from '../../src/subtitles/srt';
import { planVisualUnits } from '../../src/director/semanticPlanner';
import { buildDirectorInputV2 } from '../../src/director/contextBuilder';
import { createEffectCapability, validateEffectContent } from '../../src/director/capabilities';
import { assertCompositionCandidateScopes } from '../../src/director/candidateScope';
import { lintComposition } from '../../src/director/compositionLinter';
import { createDirectorService } from '../../src/director/service';
import { createFixtureProject } from '../../src/project/fixtures';
import type { VisualUnit } from '../../src/director/types';

const numeric = createEffectCapability({
  familyId: 'numeric', variantId: 'ring-a', displayName: '指标环 A', semanticTags: ['number'], contentSlots: ['label', 'value'], minDurationSec: 0.8, maxDurationSec: 8, supportedAspectRatios: ['16:9'], recommendedMotionCategories: [], recommendedSfxIntents: [],
});

describe('Director independent-review regressions', () => {
  it('groups the real AI-reading four-step SRT pattern and keeps the complete source transcript', () => {
    const srt = readFileSync(resolve('tests/fixtures/director/ai-reading-four-step.srt'), 'utf8');
    const result = planVisualUnits(parseSrt(srt));

    expect(result.planningMode).toBe('seed_only');
    expect(result.sourceTranscript).toHaveLength(4);
    expect(result.units).toHaveLength(1);
    expect(result.units[0]?.semanticIntent).toBe('ordered_process');
    expect(result.units[0]?.structure?.items).toHaveLength(4);
  });

  it('keeps continuation subtitles inside the ordered unit and chooses substantive duplicate markers', () => {
    const result = planVisualUnits([
      { id: 's-1', startSec: 0, endSec: 1, text: '第一步，我先问骨架' },
      { id: 's-1b', startSec: 1, endSec: 2, text: '它论证了什么、怎么论证' },
      { id: 's-2', startSec: 2, endSec: 3, text: '好，第二。' },
      { id: 's-2b', startSec: 3, endSec: 4, text: '所以第二步啊，找出反常识的点' },
      { id: 's-3', startSec: 4, endSec: 5, text: '第三步啊，好，基于我的情况。' },
      { id: 's-4', startSec: 5, endSec: 6, text: '第四步啊，然后打开书亲自阅读啊。' },
    ]);

    expect(result.units).toHaveLength(1);
    expect(result.units[0]?.sourceSubtitleIds).toEqual(['s-1', 's-1b', 's-2', 's-2b', 's-3', 's-4']);
    expect(result.units[0]?.structure?.items?.map((item) => item.text)).toEqual([
      '我先问骨架', '找出反常识的点', '好，基于我的情况。', '然后打开书亲自阅读啊。',
    ]);
  });

  it('rejects an effect selected from another VisualUnit bundle', () => {
    const composition = createFixtureProject();
    composition.effects = [composition.effects[0]!];
    composition.effects[0] = { ...composition.effects[0]!, familyId: 'numeric', variantId: 'ring-a', segmentId: 'seg-quote' };
    composition.segments = [{ ...composition.segments[0]!, segmentId: 'seg-quote', sourceSubtitleIds: ['s-quote'] }];
    const units: VisualUnit[] = [{ visualUnitId: 'vu-process', sourceSubtitleIds: ['s-process'], startSec: 0, endSec: 2, semanticIntent: 'ordered_process', importance: 1 }];

    expect(() => assertCompositionCandidateScopes(composition, units, [{ visualUnitId: 'vu-process', candidates: [numeric], retrievalReason: [] }])).toThrow(/scope/i);
  });

  it('requires a selected candidate to be present in every overlapping VisualUnit bundle', () => {
    const composition = createFixtureProject();
    composition.effects = [composition.effects[0]!];
    composition.segments = [{ ...composition.segments[0]!, sourceSubtitleIds: ['s-shared'] }];
    const units: VisualUnit[] = [
      { visualUnitId: 'vu-a', sourceSubtitleIds: ['s-shared'], startSec: 0, endSec: 2, semanticIntent: 'quote', importance: 0.5 },
      { visualUnitId: 'vu-b', sourceSubtitleIds: ['s-shared'], startSec: 0, endSec: 2, semanticIntent: 'comparison', importance: 0.5 },
    ];

    expect(() => assertCompositionCandidateScopes(composition, units, [
      { visualUnitId: 'vu-a', candidates: [numeric], retrievalReason: [] },
      { visualUnitId: 'vu-b', candidates: [], retrievalReason: [] },
    ])).toThrow(/scope/i);
  });

  it('rejects a numeric value that is labeled srt but absent from SRT evidence', () => {
    expect(validateEffectContent(numeric, { label: '增长', value: 78, provenance: { source: 'srt' } }, { srt: [42], user: [], projectData: [] })).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'numeric_value_not_evidenced' }),
    ]));
  });

  it('rejects non-finite numeric content and missing numeric evidence', () => {
    expect(validateEffectContent(numeric, { label: '增长', value: Number.NaN, provenance: { source: 'srt' } })).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'numeric_value_required' }),
    ]));
    expect(validateEffectContent(numeric, { label: '增长', value: 78, provenance: { source: 'srt' } })).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'numeric_evidence_missing' }),
    ]));
  });

  it('does not mark a seed trace as passed before a selected composition is validated', () => {
    const result = buildDirectorInputV2({
      project: { projectId: 'trace', durationSec: 12, fps: 30, canvasWidth: 1920, canvasHeight: 1080, aspectRatio: '16:9' },
      transcript: [{ id: 's-1', startSec: 0, endSec: 2, text: '一个观点' }],
      visualContext: { subjectZones: [], faceZones: [], subtitleReservedZone: null, safeMargins: 0.05 },
      effects: [{ familyId: 'quote', variantId: 'default', displayName: 'Quote', semanticTags: ['quote'], contentSlots: ['quoteText'], minDurationSec: 0.5, maxDurationSec: 4, supportedAspectRatios: ['16:9'], recommendedMotionCategories: [], recommendedSfxIntents: [] }],
      motions: [], sfx: [], preferences: {},
    });

    expect(result.selectionTrace[0]).toMatchObject({ dataContractPassed: false, durationContractPassed: false });
  });

  it('requires actual visual effects for high-importance coverage and counts major intent transitions', () => {
    const composition = createFixtureProject();
    composition.effects = [];
    composition.segments = [
      { segmentId: 'seg-1', sourceSubtitleIds: ['s-1'], startSec: 0, endSec: 2, intent: 'hook', importance: 1 },
      { segmentId: 'seg-2', sourceSubtitleIds: ['s-2'], startSec: 2, endSec: 4, intent: 'conclusion', importance: 0.5 },
    ];
    const units: VisualUnit[] = [
      { visualUnitId: 'vu-s-1', sourceSubtitleIds: ['s-1'], startSec: 0, endSec: 2, semanticIntent: 'hook', importance: 1 },
      { visualUnitId: 'vu-s-2', sourceSubtitleIds: ['s-2'], startSec: 2, endSec: 4, semanticIntent: 'conclusion', importance: 0.5 },
    ];

    const result = lintComposition(composition, [], { visualUnits: units });

    expect(result.errors.map((error) => error.code)).toContain('high_importance_coverage_missing');
    expect(result.metrics.visualEventCount).toBe(1);
  });

  it('requires cues for ranking items as well as process items', () => {
    const ranking = createEffectCapability({
      familyId: 'ranking', variantId: 'bars', displayName: 'Ranking', semanticTags: ['ranking', 'list'], contentSlots: ['items'], minDurationSec: 1, maxDurationSec: 8, supportedAspectRatios: ['16:9'], recommendedMotionCategories: [], recommendedSfxIntents: [],
    });
    const composition = createFixtureProject();
    composition.effects = [composition.effects[0]!];
    composition.effects[0] = { ...composition.effects[0]!, familyId: 'ranking', variantId: 'bars', content: { items: [{ text: '第一名' }] } };

    expect(lintComposition(composition, [ranking]).errors.map((error) => error.code)).toContain('item_cue_required');
  });

  it('keeps the complete four-step fixture as one ordered-process composition', () => {
    const source = parseSrt(readFileSync(resolve('tests/fixtures/director/ai-reading-four-step.srt'), 'utf8'));
    const unit = planVisualUnits(source).units[0]!;
    const composition = createFixtureProject();
    composition.project.durationSec = 135;
    composition.directorMeta.densityTargetPerMin = 1.5;
    composition.segments = [{ segmentId: 'seg-process', sourceSubtitleIds: unit.sourceSubtitleIds, startSec: unit.startSec, endSec: unit.endSec, intent: unit.semanticIntent, importance: unit.importance }];
    composition.effects = [{
      ...composition.effects[0]!,
      familyId: 'steps',
      variantId: 'timeline-a',
      segmentId: 'seg-process',
      time: { startSec: unit.startSec, endSec: unit.endSec },
      content: { items: (unit.structure?.items ?? []).map((item) => ({ text: item.text, cue: { startSec: item.startSec! } })) },
    }];
    const steps = createEffectCapability({
      familyId: 'steps', variantId: 'timeline-a', displayName: '步骤时间线', semanticTags: ['steps', 'process'], contentSlots: ['items'], minDurationSec: 1, maxDurationSec: 12, supportedAspectRatios: ['16:9'], timingCapabilities: ['item-reveal'], recommendedMotionCategories: [], recommendedSfxIntents: [],
    });

    const result = lintComposition(composition, [steps], { visualUnits: [unit] });

    expect(result.errors.map((error) => error.code)).not.toEqual(expect.arrayContaining(['ordered_structure_incomplete', 'item_cue_required', 'item_cue_out_of_range']));
    expect(result.ok).toBe(true);
  });

  it('marks all trace contracts as failed on a local fallback', async () => {
    const service = createDirectorService(async () => { throw new Error('provider offline'); }, () => createFixtureProject());
    const result = await service.generate({
      selectionTrace: [{ visualUnitId: 'vu-1', semanticIntent: 'quote', retrievedCandidates: ['quote:default'], dataContractPassed: true, durationContractPassed: true, selected: 'quote:default' }],
    });

    expect(result.usedFallback).toBe(true);
    expect(result.selectionTrace).toEqual([expect.objectContaining({ selected: undefined, dataContractPassed: false, durationContractPassed: false })]);
  });

  it('enforces candidate scope in the service before accepting a global ID match', async () => {
    const composition = createFixtureProject();
    composition.effects = [{ ...composition.effects[0]!, familyId: 'numeric', variantId: 'ring-a', segmentId: 'seg-quote' }];
    composition.segments = [{ ...composition.segments[0]!, segmentId: 'seg-quote', sourceSubtitleIds: ['s-quote'] }];
    const service = createDirectorService(async () => composition, () => createFixtureProject());
    const result = await service.generate({
      visualUnits: [{ visualUnitId: 'vu-process', sourceSubtitleIds: ['s-process'], startSec: 0, endSec: 2, semanticIntent: 'ordered_process', importance: 1 }],
      candidateBundles: [{ visualUnitId: 'vu-process', candidates: [numeric], retrievalReason: [] }],
      effectCapabilities: [numeric],
      candidateIndexes: { effects: [{ familyId: 'numeric', variantId: 'ring-a' }], motions: ['spring-in', 'scale-fade-out'], sfx: [] },
      selectionTrace: [{ visualUnitId: 'vu-process', semanticIntent: 'ordered_process', retrievedCandidates: ['numeric:ring-a'], dataContractPassed: false, durationContractPassed: false }],
    });

    expect(result.usedFallback).toBe(true);
    expect(result.warnings.join(' ')).toMatch(/scope/i);
  });

  it('does not accept a non-empty composition when the V2 candidate bundles are missing', async () => {
    const composition = createFixtureProject();
    const service = createDirectorService(async () => composition, () => createFixtureProject());
    const result = await service.generate({
      visualUnits: [{ visualUnitId: 'vu-process', sourceSubtitleIds: ['s-1'], startSec: 0, endSec: 2, semanticIntent: 'ordered_process', importance: 1 }],
      candidateBundles: [],
    });

    expect(result.usedFallback).toBe(true);
    expect(result.warnings.join(' ')).toMatch(/scope/i);
  });

  it('checks cues for a capability that stores items under the steps slot', () => {
    const steps = createEffectCapability({
      familyId: 'steps', variantId: 'timeline-b', displayName: 'Steps', semanticTags: ['steps'], contentSlots: ['steps'], minDurationSec: 1, maxDurationSec: 8, supportedAspectRatios: ['16:9'], recommendedMotionCategories: [], recommendedSfxIntents: [],
    });
    const composition = createFixtureProject();
    composition.effects = [{ ...composition.effects[0]!, familyId: 'steps', variantId: 'timeline-b', content: { steps: [{ text: '第一步' }] } }];

    expect(lintComposition(composition, [steps]).errors.map((error) => error.code)).toContain('item_cue_required');
  });

  it('rejects a fabricated retrieved candidate in a complete trace', async () => {
    const composition = createFixtureProject();
    const service = createDirectorService(async () => composition, () => createFixtureProject());
    const result = await service.generate({
      visualUnits: [{ visualUnitId: 'vu-1', sourceSubtitleIds: ['s-1'], startSec: 2, endSec: 8, semanticIntent: 'quote', importance: 0.8 }],
      candidateBundles: [{ visualUnitId: 'vu-1', candidates: [numeric], retrievalReason: [] }],
      selectionTrace: [{ visualUnitId: 'vu-1', semanticIntent: 'quote', retrievedCandidates: ['quote:invented'], dataContractPassed: false, durationContractPassed: false }],
    });

    expect(result.usedFallback).toBe(true);
    expect(result.warnings.join(' ')).toMatch(/trace|bundle|scope/i);
  });
});
