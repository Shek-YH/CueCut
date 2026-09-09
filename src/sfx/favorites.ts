import type { SfxDefinition } from './registry';

export interface SfxFavorites {
  toggle(sfxId: string): void;
  markUsed(sfxId: string): void;
  isFavorite(sfxId: string): boolean;
  list(): SfxDefinition[];
  recent(): SfxDefinition[];
}

export function createSfxFavorites(initial: SfxDefinition[]): SfxFavorites {
  const sounds = new Map(initial.map((sound) => [sound.sfxId, { ...sound, tags: [...sound.tags] }]));
  const recentIds: string[] = [];

  return {
    toggle(sfxId) {
      const sound = sounds.get(sfxId);
      if (!sound) throw new Error('SFX not found: ' + sfxId);
      sound.isFavorite = !sound.isFavorite;
      sound.favoriteAt = sound.isFavorite ? new Date().toISOString() : undefined;
    },
    markUsed(sfxId) {
      if (!sounds.has(sfxId)) throw new Error('SFX not found: ' + sfxId);
      const index = recentIds.indexOf(sfxId);
      if (index >= 0) recentIds.splice(index, 1);
      recentIds.unshift(sfxId);
      recentIds.splice(20);
    },
    isFavorite: (sfxId) => sounds.get(sfxId)?.isFavorite ?? false,
    list: () => [...sounds.values()].filter((sound) => sound.isFavorite),
    recent: () => recentIds.map((id) => sounds.get(id)).filter((sound): sound is SfxDefinition => Boolean(sound)),
  };
}
