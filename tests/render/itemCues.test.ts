import { describe, expect, it } from 'vitest';
import { createFixtureProject } from '../../src/project/fixtures';
import { evaluateSceneAtTime } from '../../src/render/scene';

describe('item-level cues', () => {
  it('reveals only list items whose cue has started', () => {
    const project = createFixtureProject();
    project.effects = [project.effects[0]!];
    project.effects[0] = {
      ...project.effects[0]!,
      familyId: 'list',
      variantId: 'animated-list',
      time: { startSec: 0, endSec: 10 },
      content: {
        items: [
          { text: '第一步', cue: { startSec: 1 } },
          { text: '第二步', cue: { startSec: 5 } },
        ],
      },
    };

    const atTwo = evaluateSceneAtTime(project, 2).items[0]?.content;
    const atSix = evaluateSceneAtTime(project, 6).items[0]?.content;

    expect(atTwo).toEqual({ kind: 'list', items: ['第一步'] });
    expect(atSix).toEqual({ kind: 'list', items: ['第一步', '第二步'] });
  });
});
