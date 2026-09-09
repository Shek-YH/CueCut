import type { ProjectComposition } from '../project/schema';
import { validateEffectContent } from './capabilities';
import type { EffectCapabilityCandidate, NumericEvidence, VisualContext, VisualUnit } from './types';
import { blockedZonesForVisualContext } from '../layout/visualContext';
import { findMotion } from '../motions/registry';
import { sfxRegistry } from '../sfx/registry';

export interface CompositionLintError {
  code: string;
  path: string[];
  message: string;
}

export interface CompositionLintResult {
  ok: boolean;
  errors: CompositionLintError[];
  warnings: string[];
  metrics: {
    visualEventCount: number;
    visualEventsPerMinute: number;
    highImportanceCoverage: number;
  };
}

export function lintComposition(
  composition: ProjectComposition,
  capabilities: EffectCapabilityCandidate[],
  options: { safeMargin?: number; visualUnits?: VisualUnit[]; visualContext?: VisualContext; numericEvidence?: NumericEvidence } = {},
): CompositionLintResult {
  const errors: CompositionLintError[] = [];
  const safeMargin = options.safeMargin ?? options.visualContext?.safeMargins ?? 0;
  const blockedZones = options.visualContext ? blockedZonesForVisualContext(options.visualContext) : [];
  let visualEventCount = 0;
  const capabilityById = new Map(capabilities.map((candidate) => [`${candidate.familyId}:${candidate.variantId}`, candidate]));

  composition.effects.forEach((effect, index) => {
    const path = ['effects', String(index)];
    const candidate = capabilityById.get(`${effect.familyId}:${effect.variantId}`);
    if (capabilities.length > 0 && !candidate) {
      errors.push({ code: 'unknown_effect_capability', path, message: `Effect capability is missing: ${effect.familyId}:${effect.variantId}` });
    }
    if (candidate) {
      for (const issue of validateEffectContent(candidate, effect.content, options.numericEvidence)) errors.push({ ...issue, path: [...path, 'content', ...issue.path] });
      const duration = effect.time.endSec - effect.time.startSec;
      if (duration < candidate.minDurationSec) errors.push({ code: 'duration_below_capability', path: [...path, 'time'], message: `Effect duration ${duration} is below ${candidate.minDurationSec}` });
      if (duration > candidate.maxDurationSec && !candidate.timingCapabilities?.includes('persistent') && !candidate.timingCapabilities?.includes('item-reveal')) {
        errors.push({ code: 'duration_exceeds_capability', path: [...path, 'time'], message: `Effect duration ${duration} exceeds ${candidate.maxDurationSec}` });
      }
      if (!candidate.supportedAspectRatios.includes(composition.project.aspectRatio)) errors.push({ code: 'aspect_ratio_unsupported', path, message: `Effect does not support ${composition.project.aspectRatio}` });
      for (const slot of candidate.dataContract.itemSlots) lintItemCues(effect.content[slot], effect.time, [...path, 'content', slot], errors);
    }
    if (effect.time.startSec < 0 || effect.time.endSec > composition.project.durationSec) errors.push({ code: 'time_out_of_project_range', path: [...path, 'time'], message: 'Effect time is outside the project range' });
    if (!findMotion(effect.motion.enter.motionId)) errors.push({ code: 'unknown_motion_id', path: [...path, 'motion', 'enter', 'motionId'], message: `Motion is not registered: ${effect.motion.enter.motionId}` });
    if (!findMotion(effect.motion.exit.motionId)) errors.push({ code: 'unknown_motion_id', path: [...path, 'motion', 'exit', 'motionId'], message: `Motion is not registered: ${effect.motion.exit.motionId}` });
    if (effect.sfx && !sfxRegistry.some((sfx) => sfx.sfxId === effect.sfx?.sfxId)) errors.push({ code: 'unknown_sfx_id', path: [...path, 'sfx', 'sfxId'], message: `SFX is not registered: ${effect.sfx.sfxId}` });
    const rect = effect.layout;
    const epsilon = 1e-6;
    if (rect.nx < safeMargin - epsilon || rect.ny < safeMargin - epsilon || rect.nx + rect.nw > 1 - safeMargin + epsilon || rect.ny + rect.nh > 1 - safeMargin + epsilon) errors.push({ code: 'layout_out_of_bounds', path: [...path, 'layout'], message: 'Effect layout exceeds the safe area' });
    if (blockedZones.some((blocked) => overlaps(rect, blocked))) errors.push({ code: 'layout_overlaps_visual_context', path: [...path, 'layout'], message: 'Effect layout overlaps a subject, face, subtitle reserve, or no-go zone' });
    visualEventCount += 1;
    const itemSlots = candidate?.dataContract.itemSlots.length ? candidate.dataContract.itemSlots : ['items'];
    visualEventCount += itemSlots.reduce((count, slot) => count + (Array.isArray(effect.content[slot]) ? effect.content[slot].length : 0), 0);
  });

  let previousFamily: string | undefined;
  let consecutiveFamilyCount = 0;
  composition.effects.forEach((effect, index) => {
    consecutiveFamilyCount = effect.familyId === previousFamily ? consecutiveFamilyCount + 1 : 1;
    previousFamily = effect.familyId;
    if (consecutiveFamilyCount > 3) errors.push({ code: 'excessive_repetition', path: ['effects', String(index), 'familyId'], message: `Effect family repeats more than three times consecutively: ${effect.familyId}` });
  });

  const highImportanceUnits = (options.visualUnits ?? []).filter((unit) => unit.importance >= 0.8);
  const highImportanceCoverage = highImportanceUnits.length === 0 ? 1 : highImportanceUnits.filter((unit) => {
    const linkedSegmentIds = composition.segments
      .filter((segment) => segment.sourceSubtitleIds.some((id) => unit.sourceSubtitleIds.includes(id)))
      .map((segment) => segment.segmentId);
    return composition.effects.some((effect) => linkedSegmentIds.includes(effect.segmentId));
  }).length / highImportanceUnits.length;
  if (highImportanceCoverage < 1) errors.push({ code: 'high_importance_coverage_missing', path: ['segments'], message: 'A high-importance VisualUnit has no linked visual effect' });
  for (const unit of options.visualUnits ?? []) {
    const supportedStructures = ['ordered_process', 'list', 'ranking', 'comparison'];
    if (!unit.structure || !supportedStructures.includes(unit.structure.type)) continue;
    const linkedSegmentIds = composition.segments.filter((segment) => unit.sourceSubtitleIds.some((subtitleId) => segment.sourceSubtitleIds.includes(subtitleId))).map((segment) => segment.segmentId);
    const linkedEffects = composition.effects.filter((effect) => linkedSegmentIds.includes(effect.segmentId));
    const structuredEffects = linkedEffects.filter((effect) => {
      const candidate = capabilityById.get(`${effect.familyId}:${effect.variantId}`);
      return Boolean(candidate?.dataContract.itemSlots.length && ['steps', 'list', 'ranking'].includes(candidate.dataContract.kind));
    });
    const actualItems = structuredEffects.flatMap((effect) => getEffectItems(effect, capabilityById.get(`${effect.familyId}:${effect.variantId}`)));
    const actualItemCount = actualItems.length;
    const expectedItemCount = unit.structure.items?.length ?? 0;
    if (expectedItemCount > 0 && structuredEffects.length === 0) errors.push({ code: 'ordered_effect_capability_missing', path: ['visualUnits', unit.visualUnitId], message: 'Ordered/list structure requires a linked effect with an item-capable data contract' });
    if (expectedItemCount > 0 && actualItemCount < expectedItemCount) errors.push({ code: 'ordered_structure_incomplete', path: ['visualUnits', unit.visualUnitId], message: `VisualUnit requires ${expectedItemCount} items but linked composition contains ${actualItemCount}` });
    for (const [index, expectedItem] of (unit.structure.items ?? []).entries()) {
      const actualItem = actualItems[index];
      if (!actualItem || expectedItem.startSec === undefined || expectedItem.endSec === undefined) continue;
      const cueStartSec = getItemCueStart(actualItem);
      if (cueStartSec === undefined || cueStartSec < expectedItem.startSec - 0.25 || cueStartSec > expectedItem.endSec + 0.25) {
        errors.push({ code: 'ordered_item_source_mismatch', path: ['visualUnits', unit.visualUnitId, 'items', String(index)], message: `Item ${expectedItem.id} is not cued within its source subtitle range` });
      }
    }
  }
  const majorIntentTransitions = composition.segments.filter((segment, index) => index > 0 && segment.intent !== composition.segments[index - 1]?.intent).length;
  visualEventCount += majorIntentTransitions;
  const visualEventsPerMinute = composition.project.durationSec > 0 ? visualEventCount / (composition.project.durationSec / 60) : 0;
  if ((options.visualUnits?.length ?? 0) > 0 && composition.directorMeta.densityTargetPerMin > 0) {
    const target = composition.directorMeta.densityTargetPerMin;
    if (visualEventsPerMinute < target * 0.5 || visualEventsPerMinute > target * 2) {
      errors.push({ code: 'visual_event_density_out_of_range', path: ['directorMeta', 'densityTargetPerMin'], message: `Visual events per minute ${visualEventsPerMinute} is outside the allowed range for target ${target}` });
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings: [],
    metrics: {
      visualEventCount,
      visualEventsPerMinute,
      highImportanceCoverage,
    },
  };
}

function overlaps(left: { nx: number; ny: number; nw: number; nh: number }, right: { nx: number; ny: number; nw: number; nh: number }): boolean {
  return left.nx < right.nx + right.nw && left.nx + left.nw > right.nx && left.ny < right.ny + right.nh && left.ny + left.nh > right.ny;
}

function lintItemCues(
  rawItems: unknown,
  time: { startSec: number; endSec: number },
  path: string[],
  errors: CompositionLintError[],
): void {
  if (!Array.isArray(rawItems)) return;
  let previousCue: number | undefined;
  rawItems.forEach((rawItem, index) => {
    if (!rawItem || typeof rawItem !== 'object' || Array.isArray(rawItem)) return;
    const cue = (rawItem as Record<string, unknown>).cue;
    if (!cue || typeof cue !== 'object' || Array.isArray(cue)) return;
    const startSec = (cue as Record<string, unknown>).startSec;
    if (typeof startSec !== 'number' || !Number.isFinite(startSec)) return;
    if (startSec < time.startSec || startSec > time.endSec) errors.push({ code: 'item_cue_out_of_range', path: [...path, String(index), 'cue', 'startSec'], message: 'Item cue must be inside the effect time range' });
    if (previousCue !== undefined && startSec < previousCue) errors.push({ code: 'item_cue_out_of_order', path: [...path, String(index), 'cue', 'startSec'], message: 'Item cues must be chronological' });
    previousCue = startSec;
  });
}

function getEffectItems(effect: ProjectComposition['effects'][number], candidate: EffectCapabilityCandidate | undefined): unknown[] {
  const slots = candidate?.dataContract.itemSlots.length ? candidate.dataContract.itemSlots : ['items', 'steps', 'entries'];
  return slots.flatMap((slot) => Array.isArray(effect.content[slot]) ? effect.content[slot] : []);
}

function getItemCueStart(item: unknown): number | undefined {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return undefined;
  const cue = (item as Record<string, unknown>).cue;
  if (!cue || typeof cue !== 'object' || Array.isArray(cue)) return undefined;
  const startSec = (cue as Record<string, unknown>).startSec;
  return typeof startSec === 'number' && Number.isFinite(startSec) ? startSec : undefined;
}
