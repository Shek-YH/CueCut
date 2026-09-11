import { describe, expect, it } from 'vitest';
import { fitText } from '../../src/render/textFit';
import { createFixtureProject } from '../../src/project/fixtures';
import { evaluateSceneAtTime } from '../../src/render/scene';
import { textLayoutPlanForSceneItem } from '../../src/render/textFit';

describe('fitText', () => {
  it('wraps Chinese and long English text deterministically without overflowing the width', () => {
    const result = fitText({
      text: '这是一个需要自动换行的中文标题 and-a-very-long-english-token',
      maxWidth: 180,
      maxHeight: 120,
      fontSize: 30,
      maxLines: 6,
    });

    expect(result.lines.length).toBeGreaterThan(1);
    expect(result.lines.join('').replace(/\s+/gu, '')).toContain('and-a-very-long-english-token');
    expect(result.lines.every((line) => line.length > 0)).toBe(true);
    expect(result.overflow).toBe(false);
    expect(result.fontSize).toBeLessThanOrEqual(30);
  });

  it('reduces the font size and respects maxLines while retaining all text when it fits', () => {
    const text = '第一步准备素材 第二步整理结构 第三步导出视频';
    const result = fitText({ text, maxWidth: 160, maxHeight: 72, fontSize: 28, maxLines: 2 });

    expect(result.lines.length).toBeLessThanOrEqual(2);
    expect(result.fontSize).toBeLessThan(28);
    expect(result.lineHeight * result.lines.length).toBeLessThanOrEqual(72);
    expect(result.lines.join('')).toContain('第一步');
    expect(result.lines.join('')).toContain('导出视频');
    expect(result.overflow).toBe(false);
  });

  it('marks an impossible maxLines/maxHeight request while retaining every character', () => {
    const text = '这是一段无法在一行和极小高度内放下的完整文案';
    const result = fitText({ text, maxWidth: 36, maxHeight: 10, fontSize: 20, maxLines: 1 });

    expect(result.overflow).toBe(true);
    expect(result.lines.join('').replace(/\s+/gu, '')).toBe(text);
  });

  it('marks a single glyph wider than maxWidth as overflow instead of shrinking into a false fit', () => {
    const result = fitText({ text: 'W', maxWidth: 1, maxHeight: 100, fontSize: 20, maxLines: 1 });

    expect(result.overflow).toBe(true);
    expect(result.lines.join('')).toBe('W');
  });

  it('fits 5000 characters without quadratic repeated line measurement', () => {
    const text = 'performance '.repeat(5000 / 12);
    const started = performance.now();
    const result = fitText({ text, maxWidth: 100000, maxHeight: 100000, fontSize: 24, maxLines: 1 });

    expect(result.lines.join('')).toContain('performance');
    expect(performance.now() - started).toBeLessThan(500);
  });

  it('creates one shared subtitle layout plan and retains all long subtitle text', () => {
    const project = createFixtureProject();
    const text = '这是一条很长的字幕，用于确认预览和导出共享相同的区域、行数、行高、字距与完整文本布局。';
    project.subtitles = [{ id: 'subtitle-1', startSec: 0, endSec: 10, text }];
    const item = evaluateSceneAtTime(project, 2).items.find((entry) => entry.effectId === 'subtitle-1');
    if (!item) throw new Error('Subtitle fixture item missing');

    const plan = textLayoutPlanForSceneItem(item, 1728, 183.6);
    const region = plan.regions[0];
    expect(region).toMatchObject({ maxLines: 3, letterSpacing: 0, x: expect.any(Number), y: expect.any(Number), width: expect.any(Number), height: expect.any(Number) });
    expect(region?.lines.join('').replace(/\s+/gu, '')).toContain(text);
    expect(region?.lineHeight).toBeGreaterThan(0);
  });
});
