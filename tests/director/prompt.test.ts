import { describe, expect, it } from 'vitest';
import { createFixtureProject } from '../../src/project/fixtures';
import { buildDirectorMessages } from '../../src/director/prompt';

describe('Director prompt contract', () => {
  it('states every Composition field required by the local validator', () => {
    const messages = buildDirectorMessages('skill text', {
      project: { projectId: 'demo', durationSec: 12, fps: 30, canvasWidth: 1080, canvasHeight: 1920, aspectRatio: '9:16' },
      transcript: [],
      visualContext: { subjectZones: [], faceZones: [], subtitleReservedZone: null, safeMargins: 0.05 },
      effectCandidates: [],
      motionCandidates: [],
      sfxCandidates: [],
      preferences: {},
      candidateIndexes: { effects: [], motions: [], sfx: [] },
    });
    const userMessage = messages[1]?.content ?? '';

    expect(userMessage).toContain('fps');
    expect(userMessage).toContain('canvasWidth');
    expect(userMessage).toContain('canvasHeight');
    expect(userMessage).toContain('aspectRatio');
    expect(userMessage).toContain('platformHint');
    expect(userMessage).toContain('contentStyleHint');
    expect(userMessage).toContain('nw');
    expect(userMessage).toContain('nh');
    expect(userMessage).toContain(JSON.stringify(createFixtureProject().effects[0]!.layout));
  });
});
