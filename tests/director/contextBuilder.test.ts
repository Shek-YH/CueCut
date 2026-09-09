import { describe, expect, it } from 'vitest';
import { buildDirectorInput } from '../../src/director/contextBuilder';

describe('Director Context Builder', () => {
  it('sends bounded local candidates for each semantic segment', () => {
    const input = buildDirectorInput({
      project: { projectId: 'demo', durationSec: 30, fps: 30, canvasWidth: 1920, canvasHeight: 1080, aspectRatio: '16:9' },
      transcript: [{ id: 's-1', startSec: 0, endSec: 2, text: '一个数字比例' }],
      visualContext: { subjectZones: [], faceZones: [], subtitleReservedZone: null, safeMargins: 0.05 },
      effects: Array.from({ length: 10 }, (_, index) => ({ id: 'effect-' + index, tags: ['number'] })),
      motions: Array.from({ length: 10 }, (_, index) => ({ id: 'motion-' + index, tags: ['emphasis'] })),
      sfx: Array.from({ length: 10 }, (_, index) => ({ id: 'sfx-' + index, tags: ['data'], isFavorite: false, usageScore: 0 })),
      preferences: { densityPreference: 0.5 },
    });

    expect(input.effectCandidates).toHaveLength(8);
    expect(input.motionCandidates).toHaveLength(6);
    expect(input.sfxCandidates).toHaveLength(8);
    expect(input.transcript[0]?.text).toBe('一个数字比例');
  });
});

