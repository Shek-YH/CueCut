export interface SfxDefinition {
  sfxId: string;
  title: string;
  intentCategory: string;
  stylePack: string;
  durationSec: number;
  tags: string[];
  isFavorite: boolean;
  favoriteAt?: string;
  usageScore: number;
  audioPath?: string;
  license: 'metadata-only';
}

export const sfxRegistry: SfxDefinition[] = [
  { sfxId: 'soft-pop-03', title: 'Soft Pop 03', intentCategory: 'emphasis', stylePack: 'Studio', durationSec: 0.42, tags: ['emphasis', 'number'], isFavorite: true, usageScore: 12, license: 'metadata-only' },
  { sfxId: 'studio-whoosh-02', title: 'Studio Whoosh 02', intentCategory: 'transition', stylePack: 'Studio', durationSec: 0.8, tags: ['transition', 'movement'], isFavorite: true, usageScore: 9, license: 'metadata-only' },
  { sfxId: 'glass-ding-01', title: 'Glass Ding 01', intentCategory: 'emphasis', stylePack: 'Glass', durationSec: 0.5, tags: ['conclusion', 'complete'], isFavorite: false, usageScore: 3, license: 'metadata-only' },
  { sfxId: 'digital-count-04', title: 'Digital Count 04', intentCategory: 'data', stylePack: 'Digital', durationSec: 0.65, tags: ['number', 'count'], isFavorite: false, usageScore: 5, license: 'metadata-only' },
  { sfxId: 'soft-impact-07', title: 'Soft Impact 07', intentCategory: 'impact', stylePack: 'Cinematic', durationSec: 0.7, tags: ['strong-point', 'impact'], isFavorite: false, usageScore: 2, license: 'metadata-only' },
  { sfxId: 'holo-blip-02', title: 'Holo Blip 02', intentCategory: 'digital', stylePack: 'Sci-Fi', durationSec: 0.35, tags: ['technology', 'ai'], isFavorite: false, usageScore: 1, license: 'metadata-only' },
  { sfxId: 'clean-snap-06', title: 'Clean Snap 06', intentCategory: 'emphasis', stylePack: 'Minimal', durationSec: 0.25, tags: ['step', 'align'], isFavorite: false, usageScore: 1, license: 'metadata-only' },
];

export interface RankableSfx {
  sfxId: string;
  tags: string[];
  isFavorite: boolean;
  usageScore: number;
}

export function rankSfxCandidates<T extends RankableSfx>(candidates: T[], requestedTags: string[]): T[] {
  const wanted = new Set(requestedTags);
  return candidates
    .map((candidate, index) => ({
      candidate,
      index,
      score: candidate.tags.filter((tag) => wanted.has(tag)).length * 10 + (candidate.isFavorite ? 1 : 0) + candidate.usageScore * 0.001,
    }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ candidate }) => candidate);
}

