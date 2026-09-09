import { describe, expect, it } from 'vitest';
import { createFixtureProject } from '../../src/project/fixtures';
import { createDirectorService } from '../../src/director/service';
import { createLocalFallbackComposition } from '../../src/director/localFallback';
import { createEffectCapability } from '../../src/director/capabilities';

describe('Director service', () => {
  it('uses one provider call and falls back locally when structured output is invalid', async () => {
    let calls = 0;
    const service = createDirectorService(
      async () => {
        calls += 1;
        return '{"schema":"invalid"}';
      },
      () => createFixtureProject(),
    );

    const result = await service.generate({});

    expect(calls).toBe(1);
    expect(result.usedFallback).toBe(true);
    expect(result.warnings[0]).toMatch(/issues=/);
    expect(result.composition.schema).toBe('cuecut.composition/1');
  });

  it('allows one provider call for each separate Generate operation', async () => {
    let calls = 0;
    const service = createDirectorService(
      async () => {
        calls += 1;
        return createFixtureProject();
      },
      () => createFixtureProject(),
    );

    await service.generate({ operation: 1 });
    await service.generate({ operation: 2 });

    expect(calls).toBe(2);
  });

  it('imports a Director composition without desktop-only video metadata', async () => {
    const raw = JSON.parse(JSON.stringify(createFixtureProject())) as Record<string, unknown>;
    const rawProject = raw.project as Record<string, unknown>;
    delete rawProject.video;
    const service = createDirectorService(async () => raw, () => createFixtureProject());

    const result = await service.generate({});

    expect(result.usedFallback).toBe(false);
    expect(result.composition.project.video).toEqual({ sourceFileName: null, zIndex: 0, locked: true });
  });

  it('falls back locally when output IDs are not in the provided capability index', async () => {
    const raw = createFixtureProject();
    raw.effects[0]!.motion.enter.motionId = 'invented-motion';
    const service = createDirectorService(async () => raw, () => createFixtureProject());

    const result = await service.generate({
      candidateIndexes: {
        effects: [{ familyId: 'numeric', variantId: 'ring-a' }],
        motions: ['spring-in', 'scale-fade-out'],
        sfx: [],
      },
    });

    expect(result.usedFallback).toBe(true);
    expect(result.composition.effects[0]?.motion.enter.motionId).toBe('spring-in');
  });

  it('creates a valid local fallback from project metadata without a provider', () => {
    const composition = createLocalFallbackComposition({
      project: { projectId: 'local-demo', durationSec: 45, fps: 30, canvasWidth: 1920, canvasHeight: 1080, aspectRatio: '16:9' },
    });

    expect(composition.project.projectId).toBe('local-demo');
    expect(composition.schema).toBe('cuecut.composition/1');
  });

  it('keeps ASR subtitle references when the Director uses local fallback', () => {
    const composition = createLocalFallbackComposition({
      project: { projectId: 'local-asr', durationSec: 12, fps: 30, canvasWidth: 1080, canvasHeight: 1920, aspectRatio: '9:16' },
      transcript: [{ id: 's-asr-1', startSec: 0.4, endSec: 3.2, text: 'ASR segment' }],
    });

    expect(composition.segments).toEqual([
      expect.objectContaining({ sourceSubtitleIds: ['s-asr-1'], startSec: 0.4, endSec: 3.2 }),
    ]);
  });

  it('locally removes a JSON code fence before schema validation', async () => {
    const composition = createFixtureProject();
    const service = createDirectorService(async () => '```json\n' + JSON.stringify(composition) + '\n```', () => createFixtureProject());

    const result = await service.generate({});

    expect(result.usedFallback).toBe(false);
    expect(result.composition.schema).toBe('cuecut.composition/1');
  });

  it('uses SRT semantics and local preferences when composing a fallback', () => {
    const composition = createLocalFallbackComposition({
      project: { projectId: 'preference-fallback', durationSec: 12, fps: 30, canvasWidth: 1080, canvasHeight: 1920, aspectRatio: '9:16' },
      transcript: [{ id: 's-stat', startSec: 1, endSec: 4, text: '转化率达到 92%' }],
      preferences: {
        coordinateProfiles: { '9:16': { nx: 0.72, ny: 0.12, nw: 0.2, nh: 0.24, scale: 0.9 } },
      },
    });

    expect(composition.effects[0]).toMatchObject({
      familyId: 'numeric',
      segmentId: 'seg-1',
      time: { startSec: 1, endSec: 4 },
      layout: { nx: 0.72, ny: 0.12, nw: 0.2, nh: 0.24, scale: 0.9 },
    });
  });

  it('clamps invalid Director segment timing locally before final schema validation', async () => {
    const composition = createFixtureProject();
    composition.segments[0]!.endSec = 2;
    const service = createDirectorService(async () => composition, () => createFixtureProject());

    const result = await service.generate({});

    expect(result.usedFallback).toBe(false);
    expect(result.composition.segments[0]!.endSec).toBeGreaterThan(result.composition.segments[0]!.startSec);
    expect(result.warnings).toContain('Director timing locally clamped');
  });

  it('does not treat a schema-valid but semantically invalid effect as Director success', async () => {
    const composition = createFixtureProject();
    composition.project.durationSec = 60;
    composition.effects[0]!.familyId = 'numeric';
    composition.effects[0]!.variantId = 'ring-a';
    composition.effects[0]!.content = { label: '盲区定位', value: '盲区定位' };
    composition.effects[0]!.time = { startSec: 0, endSec: 31 };
    const capability = createEffectCapability({
      familyId: 'numeric',
      variantId: 'ring-a',
      displayName: '指标环 A',
      semanticTags: ['number'],
      contentSlots: ['label', 'value'],
      minDurationSec: 0.8,
      maxDurationSec: 8,
      supportedAspectRatios: ['16:9'],
      recommendedMotionCategories: [],
      recommendedSfxIntents: [],
    });
    const service = createDirectorService(async () => composition, () => createFixtureProject());

    const result = await service.generate({
      effectCapabilities: [capability],
      candidateIndexes: {
        effects: [
          { familyId: 'numeric', variantId: 'ring-a' },
          { familyId: 'quote', variantId: 'quote-b' },
          { familyId: 'comparison', variantId: 'compare-a' },
        ],
        motions: ['spring-in', 'scale-fade-out'],
        sfx: [],
      },
    });

    expect(result.usedFallback).toBe(true);
    expect(result.warnings.some((warning) => /linter|contract|duration/i.test(warning))).toBe(true);
  });

  it('returns the candidate selection trace without requiring another provider call', async () => {
    const composition = createFixtureProject();
    const service = createDirectorService(async () => composition, () => createFixtureProject());
    const trace = [{
      visualUnitId: 'vu-1',
      semanticIntent: 'quote',
      retrievedCandidates: ['quote:quote-b'],
      selected: 'quote:quote-b',
      dataContractPassed: true,
      durationContractPassed: true,
    }];

    const result = await service.generate({ selectionTrace: trace });

    expect(result.selectionTrace).toEqual(trace);
  });
});
