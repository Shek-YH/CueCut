import { describe, expect, it } from 'vitest';
import { createFixtureProject } from '../../src/project/fixtures';
import { createGenerationWorkflow, type GenerationWorkflowDependencies } from '../../src/generation/workflow';

describe('generation workflow', () => {
  it('runs audio extraction, ASR, and one Director generation in order', async () => {
    const calls: string[] = [];
    const workflow = createGenerationWorkflow({
      extractAudio: async () => {
        calls.push('audio');
        return { audioDataUri: 'data:audio/mpeg;base64,AA==', format: 'mp3' as const };
      },
      transcribe: async () => {
        calls.push('asr');
        return {
          requestId: 'asr-1',
          processedDurationSec: 12,
          segments: [{ id: 's-1', startSec: 0, endSec: 2, text: '一个数字比例' }],
        };
      },
      generateDirector: async (input) => {
        calls.push('director');
        expect(input.transcript[0]?.text).toBe('一个数字比例');
        expect(input.candidateIndexes.effects).toEqual([{ familyId: 'numeric', variantId: 'ring-a' }]);
        return { composition: createFixtureProject(), usedFallback: false, warnings: [] };
      },
    });

    const result = await workflow.generate({
      project: { projectId: 'real-video', durationSec: 12, fps: 30, canvasWidth: 1080, canvasHeight: 1920, aspectRatio: '9:16' },
      visualContext: { subjectZones: [], faceZones: [], subtitleReservedZone: null, safeMargins: 0.05 },
      effects: [{ id: 'numeric:ring-a', tags: ['number'] }],
      motions: [{ id: 'spring-in', tags: ['spring'] }],
      sfx: [],
      preferences: {},
    });

    expect(calls).toEqual(['audio', 'asr', 'director']);
    expect(result.transcript).toHaveLength(1);
    expect(result.director.composition.schema).toBe('cuecut.composition/1');
  });

  it('passes VisualUnit-scoped bundles to the single Director call', async () => {
    let directorInput: Parameters<GenerationWorkflowDependencies['generateDirector']>[0] | undefined;
    const workflow = createGenerationWorkflow({
      extractAudio: async () => ({ audioDataUri: 'data:audio/mpeg;base64,AA==', format: 'mp3' as const }),
      transcribe: async () => ({
        requestId: 'asr-2',
        processedDurationSec: 12,
        segments: [
          { id: 's-process-1', startSec: 0, endSec: 2, text: '第一步，确定目标' },
          { id: 's-process-2', startSec: 2, endSec: 4, text: '第二步，验证结果' },
          { id: 's-quote', startSec: 4, endSec: 6, text: '有人说，先做重要的事' },
        ],
      }),
      generateDirector: async (input) => {
        directorInput = input;
        return { composition: createFixtureProject(), usedFallback: false, warnings: [] };
      },
    });

    await workflow.generate({
      project: { projectId: 'v2-workflow', durationSec: 12, fps: 30, canvasWidth: 1920, canvasHeight: 1080, aspectRatio: '16:9' },
      visualContext: { subjectZones: [], faceZones: [], subtitleReservedZone: null, safeMargins: 0.05 },
      effects: [
        { id: 'process:default', tags: ['list', 'steps'] },
        { id: 'quote:default', tags: ['quote', 'text'] },
      ],
      motions: [],
      sfx: [],
      preferences: {},
    });

    expect(directorInput?.visualUnits.map((unit) => unit.semanticIntent)).toEqual(['ordered_process', 'quote']);
    expect(directorInput?.candidateBundles.map((bundle) => bundle.visualUnitId)).toEqual(['vu-s-process-1', 'vu-s-quote']);
    expect(directorInput?.candidateIndexes.effects).toEqual([
      { familyId: 'process', variantId: 'default' },
      { familyId: 'quote', variantId: 'default' },
    ]);
  });
});
