import type { ProjectComposition } from '../project/schema';
import { validateEffectContent } from './capabilities';
import type { EffectCapabilityCandidate, VisualUnit } from './types';

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
  options: { safeMargin?: number; visualUnits?: VisualUnit[] } = {},
): CompositionLintResult {
  const errors: CompositionLintError[] = [];
  const safeMargin = options.safeMargin ?? 0;
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
    }
    if (effect.time.startSec < 0 || effect.time.endSec > composition.project.durationSec) errors.push({ code: 'time_out_of_project_range', path: [...path, 'time'], message: 'Effect time is outside the project range' });
    const rect = effect.layout;
    if (rect.nx < safeMargin || rect.ny < safeMargin || rect.nx + rect.nw > 1 - safeMargin || rect.ny + rect.nh > 1 - safeMargin) errors.push({ code: 'layout_out_of_bounds', path: [...path, 'layout'], message: 'Effect layout exceeds the safe area' });
    visualEventCount += 1;
    if (Array.isArray(effect.content.items)) visualEventCount += effect.content.items.length;
  });

  const highImportanceUnits = (options.visualUnits ?? []).filter((unit) => unit.importance >= 0.8);
  const highImportanceCoverage = highImportanceUnits.length === 0 ? 1 : highImportanceUnits.filter((unit) => composition.segments.some((segment) => segment.sourceSubtitleIds.some((id) => unit.sourceSubtitleIds.includes(id)))).length / highImportanceUnits.length;
  if (highImportanceCoverage < 1) errors.push({ code: 'high_importance_coverage_missing', path: ['segments'], message: 'A high-importance VisualUnit has no linked composition segment' });

  return {
    ok: errors.length === 0,
    errors,
    warnings: [],
    metrics: {
      visualEventCount,
      visualEventsPerMinute: composition.project.durationSec > 0 ? visualEventCount / (composition.project.durationSec / 60) : 0,
      highImportanceCoverage,
    },
  };
}
