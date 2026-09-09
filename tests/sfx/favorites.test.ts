import { describe, expect, it } from 'vitest';
import { sfxRegistry, rankSfxCandidates } from '../../src/sfx/registry';
import { createSfxFavorites } from '../../src/sfx/favorites';

describe('SFX favorites', () => {
  it('toggles favorite metadata and filters the local registry', () => {
    const favorites = createSfxFavorites(sfxRegistry);

    favorites.toggle('soft-pop-03');
    expect(favorites.isFavorite('soft-pop-03')).toBe(false);
    expect(favorites.list().some((sound) => sound.sfxId === 'soft-pop-03')).toBe(false);

    favorites.toggle('glass-ding-01');
    expect(favorites.list().map((sound) => sound.sfxId)).toContain('glass-ding-01');
  });

  it('uses favorites as a weak weight after semantic matching', () => {
    const ranked = rankSfxCandidates(
      [
        { sfxId: 'favorite-generic', tags: ['ambient'], isFavorite: true, usageScore: 100 },
        { sfxId: 'semantic-match', tags: ['emphasis'], isFavorite: false, usageScore: 0 },
      ],
      ['emphasis'],
    );

    expect(ranked[0]?.sfxId).toBe('semantic-match');
  });

  it('tracks recent usage locally without changing favorite state', () => {
    const favorites = createSfxFavorites(sfxRegistry);

    favorites.markUsed('glass-ding-01');

    expect(favorites.recent()[0]?.sfxId).toBe('glass-ding-01');
    expect(favorites.isFavorite('glass-ding-01')).toBe(false);
  });
});
