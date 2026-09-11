import { describe, expect, it } from 'vitest';
import { fallbackChainFor, selectFallback } from '../../src/packaging-fallback/engine';

describe('packaging fallback engine', () => {
  it('provides a deterministic chain for a failed behind-subject layout', () => {
    expect(fallbackChainFor('behind')).toEqual(['foreground', 'upper-safe', 'callout', 'drop']);
    expect(selectFallback([{ id: 'primary', valid: false }, { id: 'secondary', valid: true }, { id: 'drop', valid: true }])).toEqual({ id: 'secondary', valid: true });
  });
});
