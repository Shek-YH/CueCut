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

