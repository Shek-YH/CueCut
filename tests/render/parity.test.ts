import { describe, expect, it } from 'vitest';
import { createFixtureProject } from '../../src/project/fixtures';
import { createCanvasRenderer } from '../../src/render/canvasRenderer';
import { evaluateSceneAtTime } from '../../src/render/scene';

describe('preview/export SceneFrame parity', () => {
  it.each([1, 3, 5])('uses the same evaluated frame at %ss', (timeSec) => {
    const project = createFixtureProject();
    project.subtitles = [{ id: 's-1', startSec: 0.5, endSec: 5.5, text: 'Parity' }];
    const renderer = createCanvasRenderer(project);

    expect(renderer.evaluate(timeSec)).toEqual(evaluateSceneAtTime(project, timeSec));
  });
});
