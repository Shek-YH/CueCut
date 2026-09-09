import { createReadStream } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createHostGenerationRunner } from '../../src/server/generationRoute';

const runRealDirector = process.env.CUECUT_RUN_REAL_DIRECTOR === '1';

describe('Director real failed-SRT/video regression', () => {
  (runRealDirector ? it : it.skip)('runs one real ASR + Director call and returns a non-fallback composition', async () => {
    const videoPath = resolve('测试素材与api', 'ComfyUI_00001_qguot_1787042165.mp4');
    const runner = createHostGenerationRunner({ projectRoot: process.cwd() });
    const result = await runner({
      fileName: 'ComfyUI_00001_qguot_1787042165.mp4',
      video: createReadStream(videoPath),
      preferenceProfile: {},
    });

    if (result.usedFallback) {
      throw new Error('REAL_DIRECTOR_DIAGNOSTICS:' + JSON.stringify({
        warnings: result.warnings,
        selectionTrace: result.selectionTrace,
        effectFamilies: result.composition.effects.map((effect) => `${effect.familyId}:${effect.variantId}`),
      }));
    }
    expect(result.usedFallback).toBe(false);
    expect(result.composition.schema).toBe('cuecut.composition/1');
    expect(result.transcript.length).toBeGreaterThan(0);
    expect(result.selectionTrace.length).toBeGreaterThan(0);
  }, 180_000);
});
