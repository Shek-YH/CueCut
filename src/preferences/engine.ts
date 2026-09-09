export interface PreferenceContext {
  aspectRatio: string;
  familyId: string;
  [key: string]: string;
}

export interface PreferenceSample {
  key: string;
  value: string;
  context: PreferenceContext;
}

export interface PreferenceEntry extends PreferenceSample {
  confidence: number;
  sampleCount: number;
  positiveCount: number;
  negativeCount: number;
  lastSeen: string;
  sourceProjectIds: string[];
}

function contextKey(sample: PreferenceSample): string {
  return sample.key + '|' + Object.entries(sample.context).sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => key + '=' + value).join('&');
}

export function createPreferenceEngine() {
  const entries = new Map<string, PreferenceEntry>();

  return {
    observe(sample: PreferenceSample): PreferenceEntry {
      const key = contextKey(sample);
      const current = entries.get(key);
      const sampleCount = (current?.sampleCount ?? 0) + 1;
      const entry: PreferenceEntry = {
        ...sample,
        confidence: Math.min(0.95, sampleCount / (sampleCount + 2)),
        sampleCount,
        positiveCount: sampleCount,
        negativeCount: 0,
        lastSeen: new Date().toISOString(),
        sourceProjectIds: current?.sourceProjectIds ?? [],
      };
      entries.set(key, entry);
      return entry;
    },
    get(sample: PreferenceSample): PreferenceEntry | undefined {
      return entries.get(contextKey(sample));
    },
    all(): PreferenceEntry[] {
      return [...entries.values()];
    },
  };
}

