import type { ProjectComposition } from '../project/schema';
import { validateEffectContent } from './capabilities';
import type { EffectCapabilityCandidate, VisualContext, VisualUnit } from './types';
import { blockedZonesForVisualContext } from '../layout/visualContext';

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
  options: { safeMargin?: number; visualUnits?: VisualUnit[]; visualContext?: VisualContext } = {},
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
      for (const issue of validateEffectContent(candidate, effect.content)) errors.push({ ...issue, path: [...path, 'content', ...issue.path] });
      const duration = effect.time.endSec - effect.time.startSec;
      if (duration < candidate.minDurationSec) errors.push({ code: 'duration_below_capability', path: [...path, 'time'], message: `Effect duration ${duration} is below ${candidate.minDurationSec}` });
      if (duration > candidate.maxDurationSec && !candidate.timingCapabilities?.includes('persistent') && !candidate.timingCapabilities?.includes('item-reveal')) {
        errors.push({ code: 'duration_exceeds_capability', path: [...path, 'time'], message: `Effect duration ${duration} exceeds ${candidate.maxDurationSec}` });
      }
      if (!candidate.supportedAspectRatios.includes(composition.project.aspectRatio)) errors.push({ code: 'aspect_ratio_unsupported', path, message: `Effect does not support ${composition.project.aspectRatio}` });
      lintItemCues(effect.content.items, effect.time, path, errors);
    }
    if (effect.time.startSec < 0 || effect.time.endSec > composition.project.durationSec) errors.push({ code: 'time_out_of_project_range', path: [...path, 'time'], message: 'Effect time is outside the project range' });
    const rect = effect.layout;
    if (rect.nx < safeMargin || rect.ny < safeMargin || rect.nx + rect.nw > 1 - safeMargin || rect.ny + rect.nh > 1 - safeMargin) errors.push({ code: 'layout_out_of_bounds', path: [...path, 'layout'], message: 'Effect layout exceeds the safe area' });
    if (blockedZones.some((blocked) => overlaps(rect, blocked))) errors.push({ code: 'layout_overlaps_visual_context', path: [...path, 'layout'], message: 'Effect layout overlaps a subject, face, subtitle reserve, or no-go zone' });
    visualEventCount += 1;
    if (Array.isArray(effect.content.items)) visualEventCount += effect.content.items.length;
  });

  const highImportanceUnits = (options.visualUnits ?? []).filter((unit) => unit.importance >= 0.8);
  const highImportanceCoverage = highImportanceUnits.length === 0 ? 1 : highImportanceUnits.filter((unit) => composition.segments.some((segment) => segment.sourceSubtitleIds.some((id) => unit.sourceSubtitleIds.includes(id)))).length / highImportanceUnits.length;
  if (highImportanceCoverage < 1) errors.push({ code: 'high_importance_coverage_missing', path: ['segments'], message: 'A high-importance VisualUnit has no linked composition segment' });
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
    if (startSec < time.startSec || startSec > time.endSec) errors.push({ code: 'item_cue_out_of_range', path: [...path, 'content', 'items', String(index), 'cue', 'startSec'], message: 'Item cue must be inside the effect time range' });
    if (previousCue !== undefined && startSec < previousCue) errors.push({ code: 'item_cue_out_of_order', path: [...path, 'content', 'items', String(index), 'cue', 'startSec'], message: 'Item cues must be chronological' });
    previousCue = startSec;
  });
}
