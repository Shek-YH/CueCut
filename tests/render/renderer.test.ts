import { describe, expect, it, vi } from 'vitest';
import { renderSceneFrameToRgba } from '../../src/export/renderer';
import { createCanvasRenderer } from '../../src/render/canvasRenderer';
import { createFixtureProject } from '../../src/project/fixtures';
import { evaluateSceneAtTime } from '../../src/render/scene';
import { sceneItemBox, textRegionsForSceneItem } from '../../src/render/textFit';

describe('unified render runtime', () => {
  it('evaluates active effects at a frame without using React DOM', () => {
    const renderer = createCanvasRenderer(createFixtureProject());

    const frame = renderer.evaluate(6);

    expect(frame.timeSec).toBe(6);
    expect(frame.activeEffectIds).toContain('fx-ring');
    expect(frame.activeEffectIds).toContain('fx-quote');
  });

  it('renders actual text and number content from the evaluated frame', () => {
    const renderer = createCanvasRenderer(createFixtureProject());
    const context = {
      canvas: { width: 1920, height: 1080 },
      fillStyle: '',
      globalAlpha: 1,
      font: '',
      textAlign: 'left',
      filter: 'none',
      fillRect: vi.fn(),
      fillText: vi.fn(),
      strokeRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    const frame = renderer.renderFrame(6, context);

    expect(frame.items.length).toBe(3);
    expect(context.fillText).toHaveBeenCalled();
    expect(context.fillRect).toHaveBeenCalled();
  });

  it('renders long card copy as multiple fitted lines instead of one overflowing glyph run', () => {
    const project = createFixtureProject();
    project.effects[1]!.content = {
      text: '这是一段很长的卡片文案，用来验证中文与英文内容会在卡片区域内稳定拆行，而不是被压成一整行。',
    };
    const fillText = vi.fn();
    const context = {
      canvas: { width: 1920, height: 1080 },
      fillStyle: '',
      globalAlpha: 1,
      font: '',
      textAlign: 'left',
      filter: 'none',
      fillRect: vi.fn(),
      fillText,
      strokeRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    createCanvasRenderer(project).renderFrame(6, context);

    const renderedLines = fillText.mock.calls.map(([value]) => String(value));
    expect(renderedLines.some((line) => line.length > 12)).toBe(true);
    expect(renderedLines).not.toContain(project.effects[1]!.content.text);
  });

  it('shows an overflow diagnostic instead of silently hiding an impossible card copy', () => {
    const project = createFixtureProject();
    project.effects[1]!.layout = { ...project.effects[1]!.layout, nx: 0.1, ny: 0.9, nw: 0.04, nh: 0.01 };
    project.effects[1]!.content = { text: '这是一段在当前卡片尺寸和行数限制下无法完整放下的长文案' };
    const fillText = vi.fn();
    const context = {
      canvas: { width: 1920, height: 1080 },
      fillStyle: '',
      globalAlpha: 1,
      font: '',
      textAlign: 'left',
      filter: 'none',
      fillRect: vi.fn(),
      fillText,
      strokeRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    createCanvasRenderer(project).renderFrame(6, context);

    expect(fillText.mock.calls.some(([value]) => String(value).includes('⚠'))).toBe(true);
  });

  it('uses visualKind for export drawing even when visualTags are absent', () => {
    const project = createFixtureProject();
    const frame = evaluateSceneAtTime(project, 6);
    const item = frame.items.find((entry) => entry.effectId === 'fx-quote');
    if (!item) throw new Error('Chart fixture item missing');
    item.visualKind = 'chart';
    item.visualTags = [];

    const width = 1920;
    const height = 1080;
    const box = sceneItemBox(item, width, height);
    const scale = item.scale;
    const sampleX = Math.floor(box.x + 10);
    const sampleY = Math.floor(box.y + box.height * (1 - 0.28) * scale);
    const buffer = renderSceneFrameToRgba(frame, width, height);
    const offset = (sampleY * width + sampleX) * 4;

    expect([...buffer.subarray(offset, offset + 4)]).toEqual([255, 255, 255, 220]);
  });

  it('keeps quote visual semantics when its content is numeric across Canvas and export layout', () => {
    const project = createFixtureProject();
    project.effects = [{ ...project.effects[1]!, familyId: 'quote-callout', variantId: 'quote', content: { value: 92, label: '完成率' } }];
    const frame = evaluateSceneAtTime(project, 4);
    const item = frame.items.find((entry) => entry.effectId === 'fx-quote');
    if (!item) throw new Error('Quote fixture item missing');

    expect(item.visualKind).toBe('quote');
    expect(textRegionsForSceneItem(item, 600, 220)).toHaveLength(1);

    const context = {
      canvas: { width: 1920, height: 1080 },
      fillStyle: '',
      globalAlpha: 1,
      font: '',
      textAlign: 'left',
      filter: 'none',
      fillRect: vi.fn(),
      fillText: vi.fn(),
      strokeRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    createCanvasRenderer(project).renderFrame(4, context);
    expect(context.strokeRect).not.toHaveBeenCalled();
    expect(context.fillText).toHaveBeenCalledWith('92', expect.any(Number), expect.any(Number));
  });

  it('uses list visual layout for text content consistently across shared layout, Canvas, and export', () => {
    const project = createFixtureProject();
    project.effects = [{
      ...project.effects[1]!,
      familyId: 'list',
      variantId: 'animated-list',
      layout: { ...project.effects[1]!.layout, nh: 0.04 },
      content: { text: '这是列表族中的一段很长的文本内容，需要沿用列表布局并在三个渲染端保持一致。' },
    }];
    const frame = evaluateSceneAtTime(project, 4);
    const item = frame.items.find((entry) => entry.effectId === 'fx-quote');
    if (!item) throw new Error('List fixture item missing');

    expect(item.visualKind).toBe('list');
    expect(textRegionsForSceneItem(item, 600, 220)).toMatchObject([{ text: '这是列表族中的一段很长的文本内容，需要沿用列表布局并在三个渲染端保持一致。' }]);
    expect(sceneItemBox(item, 1920, 1080).height).toBeGreaterThan(project.effects[0]!.layout.nh * 1080);

    const context = {
      canvas: { width: 1920, height: 1080 },
      fillStyle: '',
      globalAlpha: 1,
      font: '',
      textAlign: 'left',
      filter: 'none',
      fillRect: vi.fn(),
      fillText: vi.fn(),
      strokeRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    createCanvasRenderer(project).renderFrame(4, context);
    expect(context.strokeRect).not.toHaveBeenCalled();
    expect(context.fillText).toHaveBeenCalled();

    const exportBox = sceneItemBox(item, 1920, 1080);
    const buffer = renderSceneFrameToRgba(frame, 1920, 1080);
    const offset = (Math.floor(exportBox.y + 1) * 1920 + Math.floor(exportBox.x + 1)) * 4;
    expect([...buffer.subarray(offset, offset + 4)]).toEqual([255, 255, 255, 220]);
  });
});
