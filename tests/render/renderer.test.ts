import { describe, expect, it } from 'vitest';
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
});

