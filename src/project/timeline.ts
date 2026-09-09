import type { ProjectComposition } from './schema';
import { sfxRegistry } from '../sfx/registry';

export type TimelineItem =
  | { type: 'VIDEO'; id: 'video'; startSec: 0; endSec: number; label: string }
  | { type: 'SUBTITLE'; id: string; startSec: number; endSec: number; text: string }
  | { type: 'EFFECT'; id: string; startSec: number; endSec: number; effect: ProjectComposition['effects'][number] }
  | { type: 'SFX'; id: string; startSec: number; endSec: number; sfxId: string; gain: number };

export function timelineItems(project: ProjectComposition): TimelineItem[] {
  return [
    {
      type: 'VIDEO',
      id: 'video',
      startSec: 0,
      endSec: project.project.durationSec,
      label: project.project.video.sourceFileName ?? '原始视频',
    },
    ...project.subtitles.map((subtitle) => ({ type: 'SUBTITLE' as const, id: subtitle.id, startSec: subtitle.startSec, endSec: subtitle.endSec, text: subtitle.text })),
    ...project.effects.map((effect) => ({ type: 'EFFECT' as const, id: effect.effectId, startSec: effect.time.startSec, endSec: effect.time.endSec, effect })),
    ...project.soundEvents.map((event) => ({ type: 'SFX' as const, id: event.eventId, startSec: event.timeSec, endSec: event.timeSec + (sfxRegistry.find((sfx) => sfx.sfxId === event.sfxId)?.durationSec ?? 0.1), sfxId: event.sfxId, gain: event.gain })),
  ];
}
