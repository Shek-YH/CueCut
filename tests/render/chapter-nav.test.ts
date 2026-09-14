import { describe, expect, it } from 'vitest';
import { createFixtureProject } from '../../src/project/fixtures';
import { evaluateSceneAtTime } from '../../src/render/scene';
import type { ProjectComposition } from '../../src/project/schema';

function withChapters(visible = true, position: 'top' | 'bottom' = 'top'): ProjectComposition {
  const project = createFixtureProject();
  project.project.durationSec = 100;
  project.effects = [];
  project.subtitles = [];
  project.chapters = [
    { id: 'c1', title: '开篇', startSec: 0, endSec: 40 },
    { id: 'c2', title: '正文', startSec: 40, endSec: 80 },
    { id: 'c3', title: '收尾', startSec: 80, endSec: 100 },
  ];
  project.project.chapterNav = { visible, position, showProgress: true };
  return project;
}

describe('chapter navigation scene evaluation', () => {
  it('appends a chapter-nav item whose activeIndex tracks the current chapter', () => {
    const project = withChapters();

    const inFirst = evaluateSceneAtTime(project, 5);
    const navFirst = inFirst.items.find((item) => item.effectId === 'chapter-nav');
    expect(navFirst).toBeDefined();
    expect(navFirst?.content).toEqual({ kind: 'chapters', items: ['开篇', '正文', '收尾'], activeIndex: 0 });
    expect(navFirst?.zIndex).toBe(90);

    // 章边界：落在 c2 [40,80)
    const atBoundary = evaluateSceneAtTime(project, 40);
    expect(atBoundary.items.find((item) => item.effectId === 'chapter-nav')?.content).toMatchObject({ activeIndex: 1 });

    const inMid = evaluateSceneAtTime(project, 60);
    expect(inMid.items.find((item) => item.effectId === 'chapter-nav')?.content).toMatchObject({ activeIndex: 1 });
  });

  it('keeps the previous chapter active during a gap between chapters', () => {
    const project = withChapters();
    project.chapters = [
      { id: 'c1', title: 'A', startSec: 0, endSec: 10 },
      { id: 'c2', title: 'B', startSec: 20, endSec: 30 },
    ];
    project.project.durationSec = 40;
    const inGap = evaluateSceneAtTime(project, 15);
    expect(inGap.items.find((item) => item.effectId === 'chapter-nav')?.content).toMatchObject({ activeIndex: 0 });
  });

  it('produces no nav item after the last chapter endSec', () => {
    const project = withChapters();
    const after = evaluateSceneAtTime(project, 100);
    expect(after.items.filter((item) => item.effectId === 'chapter-nav')).toHaveLength(0);
  });

  it('renders nav for an unsorted chapter list (external or hand-written composition)', () => {
    const project = withChapters();
    // 故意倒序：apply.ts 会排序，但手写/外部导入的 composition 可能未排序
    project.chapters = [
      { id: 'c3', title: '收尾', startSec: 80, endSec: 100 },
      { id: 'c1', title: '开篇', startSec: 0, endSec: 40 },
      { id: 'c2', title: '正文', startSec: 40, endSec: 80 },
    ];

    const inFirst = evaluateSceneAtTime(project, 10);
    const navFirst = inFirst.items.find((item) => item.effectId === 'chapter-nav');
    expect(navFirst).toBeDefined();
    // 展示顺序按时间排序：开篇 / 正文 / 收尾，且 t=10 落在首章
    expect(navFirst?.content).toEqual({ kind: 'chapters', items: ['开篇', '正文', '收尾'], activeIndex: 0 });
    expect(navFirst?.chapterProgress).toBeCloseTo(0.1, 5);

    const inSecond = evaluateSceneAtTime(project, 45);
    expect(inSecond.items.find((item) => item.effectId === 'chapter-nav')?.content).toMatchObject({ activeIndex: 1 });

    // 末章之后仍然不产出（末章止 = 100 由排序后的最后一条决定）
    expect(evaluateSceneAtTime(project, 100).items.filter((item) => item.effectId === 'chapter-nav')).toHaveLength(0);
  });

  it('produces no nav item when chapterNav.visible is false', () => {
    const project = withChapters(false);
    const frame = evaluateSceneAtTime(project, 5);
    expect(frame.items.find((item) => item.effectId === 'chapter-nav')).toBeUndefined();
    expect(frame.activeEffectIds).not.toContain('chapter-nav');
  });

  it('matches the no-chapters baseline exactly when chapters are absent', () => {
    const baseline = createFixtureProject();
    baseline.effects = [];
    baseline.subtitles = [];
    const without = evaluateSceneAtTime(baseline, 5);

    const project = createFixtureProject();
    project.effects = [];
    project.subtitles = [];
    // 显式不给 chapters：这是历史工程文件的真实形态，输出必须与改动前逐项一致
    project.chapters = undefined;
    const withUndefinedChapters = evaluateSceneAtTime(project, 5);

    expect(withUndefinedChapters.items).toEqual(without.items);
    expect(withUndefinedChapters.items.map((item) => item.effectId)).not.toContain('chapter-nav');
  });

  it('produces no nav item outside the chapter time range', () => {
    const baseline = createFixtureProject();
    baseline.effects = [];
    baseline.subtitles = [];

    const project = createFixtureProject();
    project.effects = [];
    project.subtitles = [];
    project.chapters = [{ id: 'c1', title: '开篇', startSec: 0, endSec: 40 }];
    project.project.chapterNav = { visible: true, position: 'top', showProgress: true };

    const beyond = evaluateSceneAtTime(project, 100);
    expect(beyond.items.find((item) => item.effectId === 'chapter-nav')).toBeUndefined();
    expect(beyond.items).toEqual(evaluateSceneAtTime(baseline, 100).items);
  });

  it('exposes chapterProgress from first startSec to last endSec', () => {
    const project = withChapters();
    const frame = evaluateSceneAtTime(project, 50);
    expect(frame.items.find((item) => item.effectId === 'chapter-nav')?.chapterProgress).toBeCloseTo(0.5, 5);
  });
});
