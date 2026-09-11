import { describe, expect, it } from 'vitest';
import { clampToEdgeInsets } from '../../src/packaging-layout/safeArea';

describe('packaging safe area', () => {
  it('enforces independent top, bottom, left, and right insets', () => {
    expect(clampToEdgeInsets({ x: 0, y: 0, width: 0.4, height: 0.3 }, { top: 0.1, bottom: 0.2, left: 0.05, right: 0.15 })).toEqual({ x: 0.05, y: 0.1, width: 0.4, height: 0.3 });
    expect(clampToEdgeInsets({ x: 0.9, y: 0.9, width: 0.4, height: 0.3 }, { top: 0.1, bottom: 0.2, left: 0.05, right: 0.15 })).toEqual({ x: 0.45, y: 0.5, width: 0.4, height: 0.3 });
  });
});
