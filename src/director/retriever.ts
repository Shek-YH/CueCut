import type { CandidateBundle, EffectCapabilityCandidate, SemanticIntent, VisualUnit } from './types';

export interface TaggedCandidate {
  id: string;
  tags: string[];
}

export function retrieveCandidates<T extends TaggedCandidate>(items: T[], requestedTags: string[], limit: number): T[] {
  const wanted = new Set(requestedTags);
  return items
    .map((item, index) => ({ item, index, score: item.tags.reduce((score, tag) => score + (wanted.has(tag) ? 1 : 0), 0) }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, Math.max(0, limit))
    .map(({ item }) => item);
}

const intentTags: Record<SemanticIntent, string[]> = {
  hook: ['hook', 'text', 'emphasis'],
  chapter: ['chapter', 'title', 'text'],
  argument: ['argument', 'text', 'emphasis'],
  evidence: ['evidence', 'number', 'data', 'metric', 'chart'],
  comparison: ['comparison', 'beforeafter', 'versus', 'split'],
  ordered_process: ['ordered_process', 'process', 'steps', 'checklist', 'flow', 'list'],
  list: ['list', 'steps', 'checklist'],
  definition: ['definition', 'text', 'callout'],
  quote: ['quote', 'text', 'callout'],
  conclusion: ['conclusion', 'text', 'emphasis'],
  neutral: ['text'],
};

export function retrieveCandidatesForUnits(
  units: VisualUnit[],
  candidates: EffectCapabilityCandidate[],
  aspectRatio: string,
  limit: number,
): CandidateBundle[] {
  return units.map((unit) => {
    const wanted = new Set(intentTags[unit.semanticIntent] ?? [unit.semanticIntent]);
    const ranked = candidates
      .map((candidate, index) => {
        const searchable = [
          ...candidate.semanticTags,
          ...(candidate.visualTags ?? []),
          ...(candidate.useCases ?? []),
          candidate.familyId,
          candidate.dataContract.kind,
        ].map((value) => value.toLowerCase());
        const semanticScore = searchable.reduce((score, value) => score + (wanted.has(value) ? 10 : 0), 0);
        const structureScore = unit.structure?.type && searchable.some((value) => value.includes(unit.structure!.type)) ? 8 : 0;
        const ratioScore = candidate.supportedAspectRatios.includes(aspectRatio) ? 3 : -20;
        return { candidate, index, score: semanticScore + structureScore + ratioScore };
      })
      .filter(({ candidate }) => candidate.supportedAspectRatios.includes(aspectRatio))
      .sort((left, right) => right.score - left.score || left.index - right.index)
      .slice(0, Math.max(0, limit))
      .map(({ candidate }) => candidate);
    return {
      visualUnitId: unit.visualUnitId,
      candidates: ranked,
      retrievalReason: [`semantic_intent:${unit.semanticIntent}`, `aspect_ratio:${aspectRatio}`, `limit:${Math.max(0, limit)}`],
    };
  });
}
