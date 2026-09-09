import { describe, expect, it } from 'vitest';
import { createPreferenceEngine } from '../../src/preferences/engine';
import { createPreferenceProfile } from '../../src/preferences/profile';

describe('Preference confidence', () => {
  it('does not turn a single sample into a strong rule and rises for repeated context', () => {
    const engine = createPreferenceEngine();
    const sample = { key: 'numeric.position', value: 'right', context: { aspectRatio: '9:16', familyId: 'numeric' } };

    engine.observe(sample);
    const first = engine.get(sample);
    engine.observe(sample);
    engine.observe(sample);
    const repeated = engine.get(sample);

    expect(first?.confidence).toBeLessThan(0.5);
    expect(repeated?.sampleCount).toBe(3);
    expect(repeated?.confidence).toBeGreaterThan(first?.confidence ?? 0);
  });

  it('exposes the local preference profile to Director context', () => {
    const profile = createPreferenceProfile('9:16', []);

    expect(profile).toMatchObject({
      aspectRatio: '9:16',
      densityPreference: 9,
      preferredFamilies: ['numeric', 'quote', 'comparison'],
      coordinateProfiles: { '9:16': expect.objectContaining({ nx: 0.735, ny: 0.182 }) },
      favoriteSfxIds: ['soft-pop-03', 'studio-whoosh-02'],
    });
  });
});
