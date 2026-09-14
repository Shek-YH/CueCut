import { describe, expect, it } from 'vitest';
import { findEffectTemplate } from '../../src/effects/templateRegistry';

describe('effect template layout metadata', () => {
  it('gives numeric, quote, and list templates distinct bounded geometry', () => {
    const numeric = findEffectTemplate('numeric', 'ring-a');
    const quote = findEffectTemplate('pack-0-3-quote', 'cuecut-quote-card');
    const list = findEffectTemplate('pack-0-2-beforeafter', 'cuecut-before-after-split');

    expect(numeric?.layout.defaultSize).not.toEqual(quote?.layout.defaultSize);
    expect(quote?.layout.defaultSize).not.toEqual(list?.layout.defaultSize);
    for (const template of [numeric, quote, list]) {
      if (!template) throw new Error('expected fixture template');
      expect(template.layout.minSize[0]).toBeLessThanOrEqual(template.layout.defaultSize[0]);
      expect(template.layout.defaultSize[0]).toBeLessThanOrEqual(template.layout.maxSize[0]);
      expect(template.layout.preferredZones.length).toBeGreaterThan(0);
    }
  });
});
