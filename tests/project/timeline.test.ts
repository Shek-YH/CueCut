import { describe, expect, it } from 'vitest';
import { createFixtureProject } from '../../src/project/fixtures';
import { timelineItems } from '../../src/project/timeline';

describe('canonical timeline items', () => {
  it('derives video, subtitles, effects, and SFX from the composition', () => {
    const project = createFixtureProject();
    project.subtitles = [{ id: 's-1', startSec: 1, endSec: 2, text: '字幕' }];
    project.soundEvents = [{ eventId: 'sfx-1', sfxId: 'soft-pop-03', timeSec: 1.5, gain: 0.7 }];

    expect(timelineItems(project).map((item) => item.type)).toEqual(expect.arrayContaining(['VIDEO', 'SUBTITLE', 'EFFECT', 'SFX']));
    expect(timelineItems(project).find((item) => item.type === 'SUBTITLE')).toMatchObject({ id: 's-1', text: '字幕', startSec: 1, endSec: 2 });
    expect(timelineItems(project).find((item) => item.type === 'SFX')).toMatchObject({ id: 'sfx-1', sfxId: 'soft-pop-03', startSec: 1.5, endSec: 1.92 });
  });
});
