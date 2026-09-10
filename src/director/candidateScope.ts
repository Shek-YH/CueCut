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

    const matchingUnits = visualUnits.filter((candidate) => candidate.sourceSubtitleIds.some((id) => segment.sourceSubtitleIds.includes(id)));
    if (matchingUnits.length === 0) throw new Error(`Effect ${effect.effectId} is outside the VisualUnit candidate scope: unit is missing`);
    const bundles = matchingUnits.map((unit) => candidateBundles.find((candidate) => candidate.visualUnitId === unit.visualUnitId));
    const selected = bundles.every((bundle) => bundle?.candidates.some((candidate) => candidate.familyId === effect.familyId && candidate.variantId === effect.variantId));
    if (!selected) {
      throw new Error(`Effect ${effect.effectId} is outside the VisualUnit candidate scope: ${effect.familyId}:${effect.variantId}`);
    }
  }
}

export function repairCompositionCandidateScopes(
  composition: ProjectComposition,
  visualUnits: VisualUnit[],
  candidateBundles: CandidateBundle[],
): { composition: ProjectComposition; changed: boolean } {
  if (visualUnits.length === 0 || composition.effects.length === 0) return { composition, changed: false };
  const next = structuredClone(composition);
  let changed = false;
  const nextSegments: ProjectComposition['segments'] = [];

  for (const segment of next.segments) {
    const matchingUnits = visualUnits.filter((unit) => unit.sourceSubtitleIds.some((id) => segment.sourceSubtitleIds.includes(id)));
    const effects = next.effects.filter((effect) => effect.segmentId === segment.segmentId);
    if (matchingUnits.length <= 1 || effects.length === 0) {
      nextSegments.push(segment);
      continue;
    }

    const assignments = effects.map((effect) => {
      const eligibleUnits = matchingUnits.filter((unit) => {
        const bundle = candidateBundles.find((candidate) => candidate.visualUnitId === unit.visualUnitId);
        return Boolean(bundle?.candidates.some((candidate) => candidate.familyId === effect.familyId && candidate.variantId === effect.variantId));
      });
      if (eligibleUnits.length === 0) throw new Error(`Effect ${effect.effectId} is outside the VisualUnit candidate scope: ${effect.familyId}:${effect.variantId}`);
      return { effect, unit: chooseUnitForEffect(effect, eligibleUnits) };
    });
    const byUnit = new Map<string, typeof assignments>();
    for (const assignment of assignments) byUnit.set(assignment.unit.visualUnitId, [...(byUnit.get(assignment.unit.visualUnitId) ?? []), assignment]);

    if (byUnit.size === 1) {
      nextSegments.push({ ...segment, sourceSubtitleIds: sourceIdsForUnit(segment, [...byUnit.values()][0]![0]!.unit) });
      changed = true;
      continue;
    }

    for (const [visualUnitId, unitAssignments] of byUnit) {
      const scopedSegmentId = `${segment.segmentId}__${visualUnitId}`;
      const unit = unitAssignments[0]!.unit;
      nextSegments.push({ ...segment, segmentId: scopedSegmentId, sourceSubtitleIds: sourceIdsForUnit(segment, unit), startSec: Math.max(segment.startSec, unit.startSec), endSec: Math.min(segment.endSec, unit.endSec) });
      for (const assignment of unitAssignments) {
        const effectIndex = next.effects.findIndex((effect) => effect.effectId === assignment.effect.effectId);
        if (effectIndex >= 0) next.effects[effectIndex] = { ...next.effects[effectIndex]!, segmentId: scopedSegmentId };
      }
    }
    changed = true;
  }

  return { composition: { ...next, segments: nextSegments }, changed };
}

function chooseUnitForEffect(effect: ProjectComposition['effects'][number], units: VisualUnit[]): VisualUnit {
  const itemCount = ['items', 'steps', 'entries'].reduce((count, slot) => count + (Array.isArray(effect.content[slot]) ? effect.content[slot].length : 0), 0);
  return [...units].sort((left, right) => scoreUnit(right, itemCount) - scoreUnit(left, itemCount) || left.startSec - right.startSec || left.visualUnitId.localeCompare(right.visualUnitId))[0]!;
}

function scoreUnit(unit: VisualUnit, itemCount: number): number {
  const expectedItems = unit.structure?.items?.length ?? 0;
  const structureScore = expectedItems > 0 && expectedItems === itemCount ? 100 : expectedItems > 0 ? 10 : 0;
  const processScore = unit.semanticIntent === 'ordered_process' && itemCount > 0 ? 20 : 0;
  return structureScore + processScore;
}

function sourceIdsForUnit(segment: ProjectComposition['segments'][number], unit: VisualUnit): string[] {
  const sourceIds = segment.sourceSubtitleIds.filter((id) => unit.sourceSubtitleIds.includes(id));
  return sourceIds.length > 0 ? sourceIds : [...unit.sourceSubtitleIds];
}
