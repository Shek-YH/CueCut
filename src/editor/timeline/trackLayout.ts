export interface TimelineTrackEffect {
  effectId: string;
  time: { startSec: number; endSec: number };
}

export function groupEffectsIntoTracks<T extends TimelineTrackEffect>(effects: T[]): T[][] {
  const tracks: T[][] = [];
  const ordered = effects
    .map((effect, index) => ({ effect, index }))
    .sort((left, right) => left.effect.time.startSec - right.effect.time.startSec || left.effect.time.endSec - right.effect.time.endSec || left.index - right.index);

  for (const { effect } of ordered) {
    const track = tracks.find((items) => (items.at(-1)?.time.endSec ?? 0) <= effect.time.startSec);
    if (track) track.push(effect);
    else tracks.push([effect]);
  }
  return tracks;
}
