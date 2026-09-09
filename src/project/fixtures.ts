import type { ProjectComposition } from './schema';

function effect(
  effectId: string,
  familyId: string,
  variantId: string,
  startSec: number,
  endSec: number,
  nx: number,
  ny: number,
  nw: number,
  nh: number,
): ProjectComposition['effects'][number] {
  return {
    effectId,
    segmentId: 'seg-1',
    familyId,
    variantId,
    time: { startSec, endSec },
    content: {
      headline: familyId === 'numeric' ? '比例指标' : '先把需求聊清楚',
      value: familyId === 'numeric' ? '92.4' : '',
    },
    layout: {
      nx,
      ny,
      nw,
      nh,
      scale: 0.94,
      anchor: 'top-right',
      preferredSide: 'right',
      relationToSubject: 'right',
    },
    appearance: {
      accent: '#38D4BC',
      theme: 'dark',
    },
    motion: {
      enter: { motionId: 'spring-in', durationSec: 0.52, intensity: 0.55 },
      exit: { motionId: 'scale-fade-out', durationSec: 0.32, intensity: 0.35 },
    },
    sfx: null,
    zIndex: familyId === 'numeric' ? 2 : 1,
    userFlags: { locked: false, manual: false },
    variantStateCache: {},
  };
}

export function createFixtureProject(): ProjectComposition {
  return {
    schema: 'cuecut.composition/1',
    schemaVersion: 1,
    subtitles: [],
    project: {
      projectId: 'fixture',
      durationSec: 30,
      fps: 30,
      canvasWidth: 1920,
      canvasHeight: 1080,
      aspectRatio: '16:9',
      palette: {
        background: '#10141C',
        primary: '#7868FF',
        accent: '#38D4BC',
        text: '#FFFFFF',
      },
      video: { sourceFileName: null, zIndex: 0, locked: true },
      platformHint: null,
      contentStyleHint: 'tutorial',
    },
    segments: [
      {
        segmentId: 'seg-1',
        sourceSubtitleIds: ['s-1'],
        startSec: 2.2,
        endSec: 7.8,
        intent: 'claim',
        importance: 0.82,
      },
    ],
    effects: [
      effect('fx-ring', 'numeric', 'ring-a', 5.7, 12.3, 0.68, 0.14, 0.22, 0.27),
      effect('fx-quote', 'quote', 'quote-b', 2.2, 7.8, 0.07, 0.13, 0.31, 0.17),
      effect('fx-compare', 'comparison', 'compare-a', 4.3, 10.4, 0.09, 0.69, 0.38, 0.17),
    ],
    soundEvents: [],
    directorMeta: {
      densityTargetPerMin: 9,
      maxConcurrentFx: 3,
      notes: [],
    },
  };
}
