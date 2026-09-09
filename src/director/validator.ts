export interface CandidateSelection {
  familyId: string;
  variantId: string;
  motionId: string;
  sfxId: string | null;
}

export interface CandidateIndexes {
  effects: Array<{ familyId: string; variantId: string }>;
  motions: string[];
  sfx: string[];
}

export function assertCandidateIds(selection: CandidateSelection, indexes: CandidateIndexes): void {
  const effectExists = indexes.effects.some((candidate) => candidate.familyId === selection.familyId && candidate.variantId === selection.variantId);
  if (!effectExists) throw new Error('Effect candidate is outside the provided index');
  if (!indexes.motions.includes(selection.motionId)) throw new Error('Motion candidate is outside the provided index');
  if (selection.sfxId !== null && !indexes.sfx.includes(selection.sfxId)) {
    throw new Error('SFX candidate is outside the provided index');
  }
}

export function validateCandidateIds(selection: CandidateSelection, indexes: CandidateIndexes): CandidateSelection {
  try {
    assertCandidateIds(selection, indexes);
    return selection;
  } catch {
    const effect = indexes.effects.find((candidate) => candidate.familyId === selection.familyId) ?? indexes.effects[0];
    if (!effect) throw new Error('No local Effect candidate is available for fallback');

    return {
      familyId: effect.familyId,
      variantId: effect.variantId,
      motionId: indexes.motions[0] ?? selection.motionId,
      sfxId: selection.sfxId && indexes.sfx.includes(selection.sfxId) ? selection.sfxId : null,
    };
  }
}

export function assertCompositionCandidateIds(composition: ProjectComposition, indexes: CandidateIndexes): void {
  composition.effects.forEach((effect) => {
    assertCandidateIds({
      familyId: effect.familyId,
      variantId: effect.variantId,
      motionId: effect.motion.enter.motionId,
      sfxId: effect.sfx?.sfxId ?? null,
    }, indexes);
    if (!indexes.motions.includes(effect.motion.exit.motionId)) {
      throw new Error('Exit motion candidate is outside the provided index');
    }
  });

  composition.soundEvents.forEach((event) => {
    if (!indexes.sfx.includes(event.sfxId)) throw new Error('Sound event SFX candidate is outside the provided index');
  });
}

export function sanitizeCompositionCandidateIds(composition: ProjectComposition, indexes: CandidateIndexes): { composition: ProjectComposition; warnings: string[] } {
  const next = structuredClone(composition);
  const warnings: string[] = [];

  next.effects = next.effects.map((effect) => {
    const effectCandidate = indexes.effects.find((candidate) => candidate.familyId === effect.familyId) ?? indexes.effects[0];
    if (!effectCandidate) throw new Error('No local Effect candidate is available for sanitization');
    const hasValidEffect = indexes.effects.some((candidate) => candidate.familyId === effect.familyId && candidate.variantId === effect.variantId);
    const enterMotionId = indexes.motions.includes(effect.motion.enter.motionId) ? effect.motion.enter.motionId : indexes.motions[0];
    const exitMotionId = indexes.motions.includes(effect.motion.exit.motionId) ? effect.motion.exit.motionId : indexes.motions[0];
    if (!hasValidEffect) warnings.push('Effect candidate replaced for ' + effect.effectId);
    if (enterMotionId !== effect.motion.enter.motionId) warnings.push('Enter motion replaced for ' + effect.effectId);
    if (exitMotionId !== effect.motion.exit.motionId) warnings.push('Exit motion replaced for ' + effect.effectId);
    if (effect.sfx && !indexes.sfx.includes(effect.sfx.sfxId)) warnings.push('SFX candidate removed for ' + effect.effectId);

    return {
      ...effect,
      familyId: effectCandidate.familyId,
      variantId: hasValidEffect ? effect.variantId : effectCandidate.variantId,
      motion: {
        ...effect.motion,
        enter: { ...effect.motion.enter, motionId: enterMotionId ?? effect.motion.enter.motionId },
        exit: { ...effect.motion.exit, motionId: exitMotionId ?? effect.motion.exit.motionId },
      },
      sfx: effect.sfx && indexes.sfx.includes(effect.sfx.sfxId) ? effect.sfx : null,
    };
  });
  next.soundEvents = next.soundEvents.filter((event) => {
    const valid = indexes.sfx.includes(event.sfxId);
    if (!valid) warnings.push('Sound event removed: ' + event.eventId);
    return valid;
  });

  return { composition: projectCompositionSchema.parse(next), warnings };
}
import { projectCompositionSchema, type ProjectComposition } from '../project/schema';

