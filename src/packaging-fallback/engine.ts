export type FallbackCandidate = { id: string; valid: boolean };

export function fallbackChainFor(relation: 'avoid' | 'foreground' | 'behind' | 'hug-left' | 'hug-right' | 'hero-center' | 'ignore'): string[] {
  if (relation === 'behind' || relation === 'hero-center') return ['foreground', 'upper-safe', 'callout', 'drop'];
  if (relation === 'avoid') return ['alternate-zone', 'compact', 'lighter-effect', 'drop'];
  return ['primary', 'compact', 'lighter-effect', 'drop'];
}

export function selectFallback<T extends FallbackCandidate>(candidates: T[]): T | undefined {
  return candidates.find((candidate) => candidate.valid);
}
