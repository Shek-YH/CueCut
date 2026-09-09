import { describe, expect, it } from 'vitest';
import { createEffectCapability, validateEffectContent } from '../../src/director/capabilities';
import { lintComposition } from '../../src/director/compositionLinter';
import { createFixtureProject } from '../../src/project/fixtures';

const numeric = createEffectCapability({
  familyId: 'numeric',
  variantId: 'ring-a',
  displayName: '指标环 A',
  semanticTags: ['number', 'ratio'],
  contentSlots: ['label', 'value', 'maximum'],
  minDurationSec: 0.8,
  maxDurationSec: 8,
  supportedAspectRatios: ['16:9', '9:16'],
  recommendedMotionCategories: [],
  recommendedSfxIntents: [],
});

describe('Director composition linter', () => {
  it('rejects fabricated numeric provenance instead of accepting a plausible number', () => {
    expect(validateEffectContent(numeric, { value: 78, provenance: { source: 'model-inference' } })).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'provenance_source_invalid' }),
    ]));
  });

  it('reports data-contract and capability-duration violations before Workspace handoff', () => {
    const composition = createFixtureProject();
    composition.project.durationSec = 60;
    composition.effects[0]!.familyId = 'numeric';
    composition.effects[0]!.variantId = 'ring-a';
    composition.effects[0]!.content = { label: '盲区定位', value: '盲区定位' };
    composition.effects[0]!.time = { startSec: 0, endSec: 31 };

    const result = lintComposition(composition, [numeric]);

    expect(result.ok).toBe(false);
    expect(result.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
      'numeric_value_required',
      'provenance_required',
      'duration_exceeds_capability',
    ]));
  });

  it('counts item reveals as visual events and rejects unsafe layout bounds', () => {
    const composition = createFixtureProject();
    composition.effects[0]!.content = { items: ['a', 'b', 'c', 'd'] };
    composition.effects[0]!.layout = { ...composition.effects[0]!.layout, nx: 0.9, nw: 0.3 };

    const result = lintComposition(composition, [], { safeMargin: 0.05 });

    expect(result.metrics.visualEventCount).toBeGreaterThan(1);
    expect(result.errors.map((error) => error.code)).toContain('layout_out_of_bounds');
  });

  it('requires in-range ordered item cues for step capabilities', () => {
    const steps = createEffectCapability({
      familyId: 'steps',
      variantId: 'timeline-a',
      displayName: '步骤时间线',
      semanticTags: ['list', 'steps'],
      contentSlots: ['items'],
      minDurationSec: 1,
      maxDurationSec: 12,
      supportedAspectRatios: ['16:9'],
      recommendedMotionCategories: [],
      recommendedSfxIntents: [],
    });
    const composition = createFixtureProject();
    composition.effects = [composition.effects[0]!];
    composition.effects[0] = {
      ...composition.effects[0]!,
      familyId: 'steps',
      variantId: 'timeline-a',
      time: { startSec: 10, endSec: 20 },
      content: {
        items: [
          { text: '第一步', cue: { startSec: 9 } },
          { text: '第二步' },
        ],
      },
    };

    const result = lintComposition(composition, [steps]);

    expect(result.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
      'item_cue_out_of_range',
      'item_cue_required',
    ]));
  });

  it('rejects a layout that overlaps an available face or subtitle reserve zone', () => {
    const composition = createFixtureProject();
    composition.effects = [composition.effects[0]!];
    composition.effects[0] = {
      ...composition.effects[0]!,
      layout: { ...composition.effects[0]!.layout, nx: 0.3, ny: 0.2, nw: 0.2, nh: 0.2 },
    };

    const result = lintComposition(composition, [], {
      visualContext: {
        subjectZones: [],
        faceZones: [{ nx: 0.35, ny: 0.25, nw: 0.1, nh: 0.1 }],
        subtitleReservedZone: { nx: 0.05, ny: 0.78, nw: 0.9, nh: 0.17 },
        safeMargins: 0.05,
        subjectZonesStatus: 'unavailable',
        faceZonesStatus: 'available',
      },
    });

    expect(result.errors.map((error) => error.code)).toContain('layout_overlaps_visual_context');
  });

  it('enforces visual-event density when VisualUnit context is available', () => {
    const composition = createFixtureProject();
    composition.effects = [composition.effects[0]!];

    const result = lintComposition(composition, [], {
      visualUnits: [{ visualUnitId: 'vu-s-1', sourceSubtitleIds: ['s-1'], startSec: 2.2, endSec: 7.8, semanticIntent: 'evidence', importance: 0.9 }],
    });

    expect(result.metrics.visualEventsPerMinute).toBe(2);
    expect(result.errors.map((error) => error.code)).toContain('visual_event_density_out_of_range');
  });
});
