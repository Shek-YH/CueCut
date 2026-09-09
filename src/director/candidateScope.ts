import type { ProjectComposition } from '../project/schema';
import type { CandidateBundle, VisualUnit } from './types';

/**
 * Enforces the boundary between per-VisualUnit retrieval and the final Effect.
 * The global candidate index remains an ID allow-list; this check is the
 * stronger unit-scoped proof that the selected variant was retrieved for the
 * segment's own VisualUnit.
 */
export function assertCompositionCandidateScopes(
  composition: ProjectComposition,
  visualUnits: VisualUnit[],
  candidateBundles: CandidateBundle[],
): void {
  if (visualUnits.length === 0 || composition.effects.length === 0) return;
  if (candidateBundles.length === 0) throw new Error('Composition is outside the VisualUnit candidate scope: candidate bundles are missing');

  for (const effect of composition.effects) {
    const segment = composition.segments.find((candidate) => candidate.segmentId === effect.segmentId);
    if (!segment) throw new Error(`Effect ${effect.effectId} is outside the VisualUnit candidate scope: segment is missing`);

    const unit = visualUnits.find((candidate) => candidate.sourceSubtitleIds.some((id) => segment.sourceSubtitleIds.includes(id)));
    if (!unit) throw new Error(`Effect ${effect.effectId} is outside the VisualUnit candidate scope: unit is missing`);

    const bundle = candidateBundles.find((candidate) => candidate.visualUnitId === unit.visualUnitId);
    const selected = bundle?.candidates.some((candidate) => candidate.familyId === effect.familyId && candidate.variantId === effect.variantId);
    if (!selected) {
      throw new Error(`Effect ${effect.effectId} is outside the VisualUnit candidate scope: ${effect.familyId}:${effect.variantId}`);
    }
  }
}
