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
});
