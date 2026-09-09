import type { DirectorInput } from './types';
import { createFixtureProject } from '../project/fixtures';
import { projectCompositionSchema, type ProjectComposition } from '../project/schema';

export function createLocalFallbackComposition(input: Partial<DirectorInput>): ProjectComposition {
  const fixture = createFixtureProject();
  const projectInput = input.project;
  if (projectInput) {
    fixture.project = {
      ...fixture.project,
      ...projectInput,
      video: fixture.project.video,
    };
  }

  const durationSec = fixture.project.durationSec;
  if (input.transcript?.length) {
    fixture.segments = input.transcript
      .filter((segment) => segment.endSec > segment.startSec && segment.startSec < durationSec)
      .map((segment, index) => ({
        segmentId: `seg-${index + 1}`,
        sourceSubtitleIds: [segment.id],
        startSec: Math.max(0, segment.startSec),
        endSec: Math.min(durationSec, Math.max(segment.endSec, segment.startSec + 0.1)),
        intent: 'neutral',
        importance: 0.5,
      }));
    const preference = readPreferenceProfile(input.preferences, fixture.project.aspectRatio);
    const transcriptText = input.transcript.map((segment) => segment.text).join(' ');
    fixture.effects = [...fixture.effects].sort((left, right) =>
      fallbackFamilyScore(right.familyId, transcriptText, preference.preferredFamilies) -
      fallbackFamilyScore(left.familyId, transcriptText, preference.preferredFamilies),
    ).map((effect, index) => {
      const segment = fixture.segments[index % fixture.segments.length];
      if (!segment) return effect;
      const startSec = segment.startSec;
      const endSec = Math.min(segment.endSec, startSec + Math.max(0.1, effect.time.endSec - effect.time.startSec));
      return {
        ...effect,
        segmentId: segment.segmentId,
        time: { startSec, endSec },
        layout: preference.layout ? { ...effect.layout, ...preference.layout } : effect.layout,
      };
    }).filter((effect) => effect.time.endSec > effect.time.startSec);
  }
  fixture.effects = fixture.effects
    .map((effect) => ({
      ...effect,
      time: { startSec: Math.min(effect.time.startSec, Math.max(0, durationSec - 0.1)), endSec: Math.min(effect.time.endSec, durationSec) },
    }))
    .filter((effect) => effect.time.endSec > effect.time.startSec);
  fixture.segments = fixture.segments
    .map((segment) => ({ ...segment, endSec: Math.min(segment.endSec, durationSec) }))
    .filter((segment) => segment.endSec > segment.startSec);

  return projectCompositionSchema.parse(fixture);
}

function readPreferenceProfile(preferences: Record<string, unknown> | undefined, defaultAspectRatio: string): {
  preferredFamilies: string[];
  layout?: { nx: number; ny: number; nw: number; nh: number; scale: number };
} {
  const preferredFamilies = Array.isArray(preferences?.preferredFamilies)
    ? preferences.preferredFamilies.filter((value): value is string => typeof value === 'string')
    : [];
  const aspectRatio = typeof preferences?.aspectRatio === 'string' ? preferences.aspectRatio : defaultAspectRatio;
  const profiles = preferences?.coordinateProfiles;
  const profile = aspectRatio && profiles && typeof profiles === 'object' && !Array.isArray(profiles)
    ? (profiles as Record<string, unknown>)[aspectRatio]
    : undefined;
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) return { preferredFamilies };
  const value = profile as Record<string, unknown>;
  const fields = ['nx', 'ny', 'nw', 'nh', 'scale'];
  if (!fields.every((field) => typeof value[field] === 'number')) return { preferredFamilies };
  return {
    preferredFamilies,
    layout: {
      nx: value.nx as number,
      ny: value.ny as number,
      nw: value.nw as number,
      nh: value.nh as number,
      scale: value.scale as number,
    },
  };
}

function fallbackFamilyScore(familyId: string, text: string, preferredFamilies: string[]): number {
  const preferred = preferredFamilies.indexOf(familyId);
  const semantic = /[0-9０-９%％]/.test(text) || /数字|比例|指标|统计/.test(text)
    ? familyId === 'numeric' ? 20 : 0
    : /比较|对比|区别|不同/.test(text)
      ? familyId === 'comparison' ? 20 : 0
      : /引用|观点|金句|认为/.test(text)
        ? familyId === 'quote' ? 20 : 0
        : 0;
  return semantic + (preferred >= 0 ? 10 - preferred : 0);
}
