import { describe, expect, it } from 'vitest';
import { visualSurfaceForKind } from '../../src/render/visualSurface';

describe('shared visualKind surface rules', () => {
  it.each([
    ['chart', '#111827', 0.92, 0.92],
    ['highlight', '#101B24', 0.8, 1],
    ['badge', '#3B2434', 0.9333333333333333, 1],
    ['text', '#38D4BC', 0.85, 1],
  ] as const)('%s shares its background and alpha semantics', (kind, background, backgroundAlpha, contentAlpha) => {
    expect(visualSurfaceForKind(kind, '#38D4BC')).toMatchObject({ background, backgroundAlpha, contentAlpha });
  });

  it('keeps chart, list, and quote accent layers enabled for both renderers', () => {
    expect(visualSurfaceForKind('chart', '#38D4BC')).toMatchObject({ accent: '#38D4BC', accentAlpha: 0.92 });
    expect(visualSurfaceForKind('list', '#38D4BC')).toMatchObject({ background: '#171B26', accent: '#38D4BC', accentAlpha: 1, accentBar: true });
    expect(visualSurfaceForKind('quote', '#38D4BC')).toMatchObject({ background: '#282341', accent: '#38D4BC', accentAlpha: 1, accentBar: true });
  });
});
