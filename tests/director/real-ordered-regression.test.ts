import { createReadStream } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createHostGenerationRunner } from '../../src/server/generationRoute';

const runRealOrderedDirector = process.env.CUECUT_RUN_REAL_ORDERED_DIRECTOR === '1';

describe('Director real ordered-process regression', () => {
  (runRealOrderedDirector ? it : it.skip)('preserves the four-step process from the real AI-reading video', async () => {
    const videoPath = resolve('测试素材与api', 'jj.mp4');
    const runner = createHostGenerationRunner({ projectRoot: process.cwd() });
    const result = await runner({ fileName: 'jj.mp4', video: createReadStream(videoPath), preferenceProfile: {} });

    if (result.usedFallback) {
      throw new Error('REAL_ORDERED_DIRECTOR_DIAGNOSTICS:' + JSON.stringify({ warnings: result.warnings, selectionTrace: result.selectionTrace }));
    }
    const orderedEffects = result.composition.effects.filter((effect) => ['items', 'steps', 'entries'].some((slot) => Array.isArray(effect.content[slot]) && effect.content[slot].length >= 4));
    expect(result.usedFallback).toBe(false);
    expect(result.selectionTrace.some((entry) => entry.semanticIntent === 'ordered_process')).toBe(true);
    expect(orderedEffects.length).toBeGreaterThan(0);
    expect(orderedEffects.some((effect) => ['items', 'steps', 'entries'].some((slot) => Array.isArray(effect.content[slot]) && (effect.content[slot] as unknown[]).every(hasCue)))).toBe(true);
  }, 360_000);
});

function hasCue(item: unknown): boolean {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
  const cue = (item as Record<string, unknown>).cue;
  return Boolean(cue && typeof cue === 'object' && !Array.isArray(cue) && typeof (cue as Record<string, unknown>).startSec === 'number');
}
