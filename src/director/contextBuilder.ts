import { retrieveCandidates } from './retriever';
import { retrieveCandidatesForUnits } from './retriever';
import { createEffectCapability } from './capabilities';
import { planVisualUnits } from './semanticPlanner';
import type { DirectorInput, DirectorInputV2, TranscriptInput, VisualContext } from './types';
import type { EffectDefinition } from '../effects/registry';

interface Candidate {
  id: string;
  tags: string[];
}

interface SfxCandidate extends Candidate {
  isFavorite: boolean;
  usageScore: number;
}

function semanticTags(transcript: TranscriptInput[]): string[] {
  const text = transcript.map((segment) => segment.text).join(' ');
  const tags: string[] = [];
  if (/[0-9０-９%％]/.test(text) || /数字|比例|指标|统计/.test(text)) tags.push('number', 'data');
  if (/比较|对比|区别|不同/.test(text)) tags.push('comparison');
  if (/引用|观点|金句|认为/.test(text)) tags.push('quote');
  if (/强调|重点|注意|关键/.test(text)) tags.push('emphasis');
  return tags.length ? tags : ['neutral'];
}

/**
 * @deprecated Production Director generation uses buildDirectorInputV2. This
 * adapter remains only for legacy callers and must not be used as the runtime
 * Director path because it intentionally exposes the old global-tag shape.
 */
export function buildDirectorInput(input: {
  project: DirectorInput['project'];
  transcript: TranscriptInput[];
  visualContext: VisualContext;
  effects: Candidate[];
  motions: Candidate[];
  sfx: SfxCandidate[];
  preferences: Record<string, unknown>;
}): DirectorInput {
  const tags = semanticTags(input.transcript);
  const rankedSfx = input.sfx
    .map((candidate, index) => ({
      candidate,
      index,
      score: candidate.tags.filter((tag) => tags.includes(tag)).length * 10 + (candidate.isFavorite ? 1 : 0) + candidate.usageScore * 0.001,
    }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, 8)
    .map(({ candidate }) => candidate);

  return {
    project: input.project,
    transcript: input.transcript,
    visualContext: input.visualContext,
    effectCandidates: retrieveCandidates(input.effects, tags, 8),
    motionCandidates: retrieveCandidates(input.motions, tags, 6),
    sfxCandidates: rankedSfx,
    preferences: input.preferences,
  };
}

export function buildDirectorInputV2(input: {
  project: DirectorInput['project'];
  transcript: TranscriptInput[];
  visualContext: VisualContext;
  effects: Array<EffectDefinition | Candidate>;
  motions: Candidate[];
  sfx: SfxCandidate[];
  preferences: Record<string, unknown>;
}): DirectorInputV2 {
  const semanticPlan = planVisualUnits(input.transcript);
  const effectCapabilities = input.effects.map(normalizeEffectDefinition).map(createEffectCapability);
  const candidateBundles = retrieveCandidatesForUnits(semanticPlan.units, effectCapabilities, input.project.aspectRatio, 8);
  const selectionTrace = candidateBundles.map((bundle) => ({
    visualUnitId: bundle.visualUnitId,
    semanticIntent: semanticPlan.units.find((unit) => unit.visualUnitId === bundle.visualUnitId)?.semanticIntent ?? 'neutral',
    retrievedCandidates: bundle.candidates.map((candidate) => `${candidate.familyId}:${candidate.variantId}`),
    dataContractPassed: false,
    durationContractPassed: false,
  }));
  return {
    project: input.project,
    transcript: input.transcript,
    visualContext: input.visualContext,
    effectCandidates: [],
    motionCandidates: input.motions,
    sfxCandidates: input.sfx.slice(0, 8),
    preferences: input.preferences,
    visualUnits: semanticPlan.units,
    effectCapabilities,
    candidateBundles,
    selectionTrace,
    semanticPlan,
  };
}

function normalizeEffectDefinition(effect: EffectDefinition | Candidate): EffectDefinition {
  if ('contentSlots' in effect && 'displayName' in effect && 'minDurationSec' in effect) return effect;
  const [familyId, variantId = familyId] = effect.id.split(':');
  return {
    familyId: familyId ?? effect.id,
    variantId: variantId ?? effect.id,
    displayName: effect.id,
    semanticTags: [...effect.tags],
    contentSlots: effect.tags.includes('steps') || effect.tags.includes('list') ? ['items'] : ['text'],
    minDurationSec: 0.1,
    maxDurationSec: 8,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    recommendedMotionCategories: [],
    recommendedSfxIntents: [],
  };
}
