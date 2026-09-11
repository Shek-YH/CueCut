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

    const frame = createCanvasRenderer(project).renderFrame(6, context);

    expect(frame.diagnostics).toEqual([{ effectId: 'fx-quote', code: 'text-overflow', message: expect.any(String) }]);
    expect(fillText.mock.calls.some(([value]) => String(value).includes('⚠'))).toBe(false);
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

    expect([...buffer.subarray(offset, offset + 4)]).toEqual([56, 212, 188, 235]);
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
    expect([...buffer.subarray(offset, offset + 4)]).toEqual([56, 212, 188, 255]);
  });

  it('clips Canvas text to its text region instead of relying only on the item box', () => {
    const project = createFixtureProject();
    project.effects = [{
      ...project.effects[1]!,
      familyId: 'quote-callout',
      variantId: 'quote',
      content: { text: '一段很长的文本，用于验证 Canvas 文本绘制会建立独立的 region 裁剪边界。' },
    }];
    const rect = vi.fn();
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
      beginPath: vi.fn(),
      rect,
      clip: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    createCanvasRenderer(project).renderFrame(4, context);

    expect(rect).toHaveBeenCalledWith(0, 0, expect.any(Number), expect.any(Number));
    expect(rect).toHaveBeenCalledWith(20, 0, expect.any(Number), expect.any(Number));
  });

  it('aligns list, quote, and chart visual family backgrounds in export', () => {
    const frame = evaluateSceneAtTime(createFixtureProject(), 6);
    const items = frame.items.filter((item) => item.variantId !== 'subtitle');
    const [list, quote, chart] = items;
    if (!list || !quote || !chart) throw new Error('Visual family fixtures missing');
    list.visualKind = 'list';
    list.visualTags = [];
    list.layout = { ...list.layout, nx: 0.03, ny: 0.05, nw: 0.2, nh: 0.25 };
    quote.visualKind = 'quote';
    quote.visualTags = [];
    quote.layout = { ...quote.layout, nx: 0.3, ny: 0.05, nw: 0.2, nh: 0.25 };
    chart.visualKind = 'chart';
    chart.visualTags = [];
    chart.layout = { ...chart.layout, nx: 0.57, ny: 0.05, nw: 0.2, nh: 0.25 };

    const width = 1000;
    const height = 600;
    const buffer = renderSceneFrameToRgba(frame, width, height);
    const listBox = sceneItemBox(list, width, height);
    const quoteBox = sceneItemBox(quote, width, height);
    const chartBox = sceneItemBox(chart, width, height);
    const pixel = (x: number, y: number) => {
      const offset = (Math.floor(y) * width + Math.floor(x)) * 4;
      return [...buffer.subarray(offset, offset + 4)];
    };

    expect(pixel(listBox.x + 1, listBox.y + 1)).toEqual([56, 212, 188, 255]);
    expect(pixel(quoteBox.x + 1, quoteBox.y + 1)).toEqual([56, 212, 188, 255]);
    expect(pixel(chartBox.x + 1, chartBox.y + 1)).toEqual([17, 24, 39, 235]);
  });

  it('keeps Canvas and export on the same shared alpha rule for chart surfaces', () => {
    const project = createFixtureProject();
    project.effects = [{ ...project.effects[0]!, familyId: 'chart', variantId: 'chart', content: { text: 'chart' } }];
    const fillCalls: Array<{ alpha: number; fillStyle: string }> = [];
    const context = {
      canvas: { width: 1920, height: 1080 },
      fillStyle: '',
      globalAlpha: 1,
      font: '',
      textAlign: 'left',
      filter: 'none',
      fillRect: vi.fn(() => fillCalls.push({ alpha: context.globalAlpha, fillStyle: context.fillStyle })),
      fillText: vi.fn(),
      strokeRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    createCanvasRenderer(project).renderFrame(6, context);
    const chartSurface = fillCalls.find((call) => call.fillStyle === '#111827');
    expect(chartSurface?.alpha).toBeCloseTo(0.92, 5);

    const frame = evaluateSceneAtTime(project, 6);
    const item = frame.items[0];
    if (!item) throw new Error('Chart fixture item missing');
    const box = sceneItemBox(item, 1920, 1080);
    const buffer = renderSceneFrameToRgba(frame, 1920, 1080);
    const offset = (Math.floor(box.y + 1) * 1920 + Math.floor(box.x + 1)) * 4;
    expect([...buffer.subarray(offset, offset + 4)]).toEqual([17, 24, 39, 235]);
  });
});
