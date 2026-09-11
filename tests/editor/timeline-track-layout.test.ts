import { describe, expect, it } from 'vitest';
import { groupEffectsIntoTracks } from '../../src/editor/timeline/trackLayout';

describe('timeline effect track layout', () => {
  it('reuses one row for sequential effects and adds rows only for overlaps', () => {
    const tracks = groupEffectsIntoTracks([
      { effectId: 'first', time: { startSec: 0, endSec: 2 } },
      { effectId: 'second', time: { startSec: 2, endSec: 4 } },
      { effectId: 'third', time: { startSec: 1, endSec: 3 } },
    ]);

    expect(tracks).toHaveLength(2);
    expect(tracks[0]?.map((effect) => effect.effectId)).toEqual(['first', 'second']);
    expect(tracks[1]?.map((effect) => effect.effectId)).toEqual(['third']);
  });
});
