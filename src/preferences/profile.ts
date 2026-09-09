import type { PreferenceEntry } from './engine';

export function createPreferenceProfile(aspectRatio: string, entries: PreferenceEntry[]): Record<string, unknown> {
  return {
    aspectRatio,
    densityPreference: 9,
    preferredFamilies: ['numeric', 'quote', 'comparison'],
    coordinateProfiles: {
      [aspectRatio]: { nx: 0.735, ny: 0.182, nw: 0.22, nh: 0.27, scale: 0.91 },
    },
    favoriteSfxIds: ['soft-pop-03', 'studio-whoosh-02'],
    motionIntensityPreference: 0.55,
    maxConcurrentFx: 3,
    learnedEntries: entries.map((entry) => ({
      key: entry.key,
      value: entry.value,
      context: entry.context,
      confidence: entry.confidence,
      sampleCount: entry.sampleCount,
    })),
    evidenceConfidence: entries.length
      ? entries.reduce((total, entry) => total + entry.confidence, 0) / entries.length
      : 0,
  };
}
