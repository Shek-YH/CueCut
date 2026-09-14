import { describe, expect, it } from 'vitest';
import { createFixtureProject } from '../../src/project/fixtures';
import { evaluateSceneAtTime } from '../../src/render/scene';
import { renderSceneFrameToRgba } from '../../src/export/renderer';

function countBarPixels(buffer: Buffer, width: number, height: number): number {
  const x0 = Math.floor(0.03 * width);
  const x1 = Math.floor(0.97 * width);
  const y0 = Math.floor(0.02 * height);
  const y1 = Math.floor(0.08 * height);
  let count = 0;
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const offset = (y * width + x) * 4;
      if (buffer[offset + 3] > 0) count += 1;
    }
  }
  return count;
}

describe('chapter navigation export pixels', () => {
  it('draws a non-empty top bar when chapters are present', () => {
    const project = createFixtureProject();
    project.project.durationSec = 100;
    project.effects = [];
    project.subtitles = [];
    project.chapters = [
      { id: 'c1', title: '开篇', startSec: 0, endSec: 40 },
      { id: 'c2', title: '正文', startSec: 40, endSec: 80 },
    ];
    project.project.chapterNav = { visible: true, position: 'top', showProgress: true };

    const buffer = renderSceneFrameToRgba(evaluateSceneAtTime(project, 10), project.project.canvasWidth, project.project.canvasHeight);
    expect(countBarPixels(buffer, project.project.canvasWidth, project.project.canvasHeight)).toBeGreaterThan(0);
  });

  it('draws no bar pixels when there are no chapters (no default side effect)', () => {
    const project = createFixtureProject();
    project.effects = [];
    project.subtitles = [];

    const buffer = renderSceneFrameToRgba(evaluateSceneAtTime(project, 10), project.project.canvasWidth, project.project.canvasHeight);
    expect(countBarPixels(buffer, project.project.canvasWidth, project.project.canvasHeight)).toBe(0);
  });

  it('draws no bar when chapterNav is hidden', () => {
    const project = createFixtureProject();
    project.project.durationSec = 100;
    project.effects = [];
    project.subtitles = [];
    project.chapters = [{ id: 'c1', title: '开篇', startSec: 0, endSec: 40 }];
    project.project.chapterNav = { visible: false, position: 'top', showProgress: true };

    const buffer = renderSceneFrameToRgba(evaluateSceneAtTime(project, 10), project.project.canvasWidth, project.project.canvasHeight);
    expect(countBarPixels(buffer, project.project.canvasWidth, project.project.canvasHeight)).toBe(0);
  });
});
