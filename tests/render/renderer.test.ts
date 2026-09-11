import { describe, expect, it, vi } from 'vitest';
import { createCanvasRenderer } from '../../src/render/canvasRenderer';
import { createFixtureProject } from '../../src/project/fixtures';

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
});
