import { projectCompositionSchema, type ProjectComposition } from '../project/schema';
import { createOneCallGuard } from './oneCallGuard';
import { assertCompositionCandidateIds, sanitizeCompositionCandidateIds, type CandidateIndexes } from './validator';
import { lintComposition } from './compositionLinter';
import { assertCompositionCandidateScopes } from './candidateScope';
import type { EffectCapabilityCandidate, NumericEvidence, SelectionTraceEntry, VisualUnit } from './types';
import { resolveCompositionLayout } from '../layout/compositionLayout';

export interface DirectorResult {
  composition: ProjectComposition;
  usedFallback: boolean;
  warnings: string[];
  selectionTrace?: import('./types').SelectionTraceEntry[];
  lint?: import('./compositionLinter').CompositionLintResult;
}

export type DirectorProvider = (input: unknown) => Promise<unknown>;
export type LocalDirectorFallback = (input: unknown) => ProjectComposition;

export function createDirectorService(provider: DirectorProvider, fallback: LocalDirectorFallback) {
  return {
    async generate(input: unknown): Promise<DirectorResult> {
      const guard = createOneCallGuard<unknown>();
      let raw: unknown;
      try {
        raw = await guard.run(() => provider(input));
      } catch (error) {
        return {
          composition: fallback(input),
          usedFallback: true,
          warnings: [error instanceof Error ? error.message : 'Director provider failed'],
          selectionTrace: fallbackSelectionTrace(input),
        };
      }

      const parsed = typeof raw === 'string' ? parseJson(raw) : raw;
      const timingRepair = clampCompositionTiming(parsed);
      const result = projectCompositionSchema.safeParse(timingRepair.value);
      if (!result.success) {
        return {
          composition: fallback(input),
          usedFallback: true,
          warnings: ['Director structured output failed local schema validation; issues=' + summarizeSchemaIssues(result.error)],
          selectionTrace: fallbackSelectionTrace(input),
        };
      }

      const capabilityRepair = repairCompositionCapabilityDuration(result.data, getEffectCapabilities(input));
      const timingWarnings = [
        ...(timingRepair.changed ? ['Director timing locally clamped'] : []),
        ...(capabilityRepair.changed ? ['Director effect duration repaired to capability bounds'] : []),
      ];
      const resolvedComposition = applyVisualContextLayout(capabilityRepair.value, input);

      const candidateIndexes = getCandidateIndexes(input);
      if (candidateIndexes) {
        try {
          assertCompositionCandidateIds(resolvedComposition, candidateIndexes);
        } catch (error) {
          const sanitized = sanitizeCompositionCandidateIds(resolvedComposition, candidateIndexes);
          return { composition: sanitized.composition, usedFallback: true, warnings: [...timingWarnings, ...(sanitized.warnings.length ? sanitized.warnings : [error instanceof Error ? error.message : 'Director candidate validation failed'])], selectionTrace: fallbackSelectionTrace(input) };
        }
      }

      try {
        if (hasCandidateBundles(input)) assertCompositionCandidateScopes(resolvedComposition, getVisualUnits(input), getCandidateBundles(input));
      } catch (error) {
        return {
          composition: fallback(input),
          usedFallback: true,
          warnings: [...timingWarnings, error instanceof Error ? error.message : 'Director candidate scope validation failed'],
          selectionTrace: fallbackSelectionTrace(input),
        };
      }

      const compositionLint = lintComposition(resolvedComposition, getEffectCapabilities(input), {
        safeMargin: getSafeMargin(input),
        visualUnits: getVisualUnits(input),
        visualContext: getVisualContext(input),
        numericEvidence: getNumericEvidence(input),
      });
      if (!compositionLint.ok) {
        return {
          composition: fallback(input),
          usedFallback: true,
          warnings: [...timingWarnings, 'Director composition linter failed: ' + compositionLint.errors.map((error) => `${error.code}@${error.path.join('.')}`).join(',')],
          selectionTrace: fallbackSelectionTrace(input),
          lint: compositionLint,
        };
      }

      const selectionTrace = materializeSelectionTrace(input, resolvedComposition, compositionLint);
      const selectionTraceIssue = validateSelectionTrace(input, selectionTrace);
      if (selectionTraceIssue) {
        return {
          composition: fallback(input),
          usedFallback: true,
          warnings: [...timingWarnings, selectionTraceIssue],
          selectionTrace: fallbackSelectionTrace(input),
          lint: compositionLint,
        };
      }
      return { composition: resolvedComposition, usedFallback: false, warnings: timingWarnings, selectionTrace, lint: compositionLint };
    },
  };
}

function getEffectCapabilities(input: unknown): EffectCapabilityCandidate[] {
  if (!input || typeof input !== 'object' || !('effectCapabilities' in input)) return [];
  const capabilities = (input as { effectCapabilities?: unknown }).effectCapabilities;
  return Array.isArray(capabilities) ? capabilities as EffectCapabilityCandidate[] : [];
}

function getSelectionTrace(input: unknown): SelectionTraceEntry[] {
  if (!input || typeof input !== 'object' || !('selectionTrace' in input)) return [];
  const trace = (input as { selectionTrace?: unknown }).selectionTrace;
  return Array.isArray(trace) ? trace as SelectionTraceEntry[] : [];
}

function fallbackSelectionTrace(input: unknown): SelectionTraceEntry[] {
  return getSelectionTrace(input).map((entry) => ({
    ...entry,
    selected: undefined,
    dataContractPassed: false,
    durationContractPassed: false,
  }));
}

function getCandidateBundles(input: unknown): import('./types').CandidateBundle[] {
  if (!input || typeof input !== 'object' || !('candidateBundles' in input)) return [];
  const bundles = (input as { candidateBundles?: unknown }).candidateBundles;
  return Array.isArray(bundles) ? bundles as import('./types').CandidateBundle[] : [];
}

function hasCandidateBundles(input: unknown): boolean {
  return Boolean(input && typeof input === 'object' && 'candidateBundles' in input);
}

function materializeSelectionTrace(
  input: unknown,
  composition: ProjectComposition,
  lint: import('./compositionLinter').CompositionLintResult,
): SelectionTraceEntry[] {
  const units = getVisualUnits(input);
  return getSelectionTrace(input).map((entry) => {
    const unit = units.find((candidate) => candidate.visualUnitId === entry.visualUnitId);
    const segmentIds = composition.segments
      .filter((segment) => unit?.sourceSubtitleIds.some((subtitleId) => segment.sourceSubtitleIds.includes(subtitleId)))
      .map((segment) => segment.segmentId);
    const effectIndex = composition.effects.findIndex((effect) => segmentIds.includes(effect.segmentId));
    const selectedEffect = effectIndex >= 0 ? composition.effects[effectIndex] : undefined;
    const effectErrors = effectIndex >= 0
      ? lint.errors.filter((error) => error.path[0] === 'effects' && error.path[1] === String(effectIndex))
      : [];
    return {
      ...entry,
      selected: selectedEffect ? `${selectedEffect.familyId}:${selectedEffect.variantId}` : undefined,
      dataContractPassed: Boolean(selectedEffect) && !effectErrors.some((error) => /required|provenance|items|numeric_value_not_evidenced/.test(error.code)),
      durationContractPassed: Boolean(selectedEffect) && !effectErrors.some((error) => error.code.startsWith('duration_')),
    };
  });
}

function validateSelectionTrace(input: unknown, trace: SelectionTraceEntry[]): string | undefined {
  const units = getVisualUnits(input);
  if (units.length === 0) return undefined;
  const expectedIds = new Set(units.map((unit) => unit.visualUnitId));
  const actualIds = new Set(trace.map((entry) => entry.visualUnitId));
  if (trace.length !== units.length || actualIds.size !== units.length || [...expectedIds].some((id) => !actualIds.has(id))) {
    return 'Director SelectionTrace is incomplete: every VisualUnit must have exactly one trace entry';
  }
  const bundles = getCandidateBundles(input);
  if (!hasCandidateBundles(input)) return undefined;
  for (const entry of trace) {
    const bundle = bundles.find((candidate) => candidate.visualUnitId === entry.visualUnitId);
    if (!bundle) return `Director SelectionTrace has no CandidateBundle for ${entry.visualUnitId}`;
    const candidateIds = new Set(bundle.candidates.map((candidate) => `${candidate.familyId}:${candidate.variantId}`));
    if (entry.retrievedCandidates.some((candidateId) => !candidateIds.has(candidateId))) {
      return `Director SelectionTrace retrieved candidate is outside bundle scope for ${entry.visualUnitId}`;
    }
    if (entry.selected && !candidateIds.has(entry.selected)) {
      return `Director SelectionTrace selected candidate is outside bundle scope for ${entry.visualUnitId}`;
    }
  }
  return undefined;
}

function getNumericEvidence(input: unknown): NumericEvidence | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const record = input as { transcript?: unknown; preferences?: unknown };
  const transcript = Array.isArray(record.transcript) ? record.transcript : [];
  const srt = transcript.flatMap((segment) => typeof segment === 'object' && segment && 'text' in segment ? extractNumbers((segment as { text?: unknown }).text) : []);
  const preferences = record.preferences && typeof record.preferences === 'object' ? record.preferences as Record<string, unknown> : {};
  return {
    srt,
    user: extractNumbersFromValue(preferences.userData),
    projectData: extractNumbersFromValue(preferences.projectData),
  };
}

function extractNumbers(value: unknown): number[] {
  if (typeof value !== 'string') return [];
  return [...value.matchAll(/[-+]?\d+(?:\.\d+)?/g)].map((match) => Number(match[0])).filter(Number.isFinite);
}

function extractNumbersFromValue(value: unknown): number[] {
  if (typeof value === 'number' && Number.isFinite(value)) return [value];
  if (Array.isArray(value)) return value.flatMap(extractNumbersFromValue);
  if (value && typeof value === 'object') return Object.values(value as Record<string, unknown>).flatMap(extractNumbersFromValue);
  return extractNumbers(value);
}

function getVisualUnits(input: unknown): VisualUnit[] {
  if (!input || typeof input !== 'object' || !('visualUnits' in input)) return [];
  const units = (input as { visualUnits?: unknown }).visualUnits;
  return Array.isArray(units) ? units as VisualUnit[] : [];
}

function getSafeMargin(input: unknown): number {
  if (!input || typeof input !== 'object' || !('visualContext' in input)) return 0;
  const context = (input as { visualContext?: unknown }).visualContext;
  if (!context || typeof context !== 'object' || typeof (context as { safeMargins?: unknown }).safeMargins !== 'number') return 0;
  return Math.max(0, (context as { safeMargins: number }).safeMargins);
}

function getVisualContext(input: unknown): import('./types').VisualContext | undefined {
  if (!input || typeof input !== 'object' || !('visualContext' in input)) return undefined;
  const context = (input as { visualContext?: unknown }).visualContext;
  return context && typeof context === 'object' && !Array.isArray(context) ? context as import('./types').VisualContext : undefined;
}

function applyVisualContextLayout(composition: ProjectComposition, input: unknown): ProjectComposition {
  const context = getVisualContext(input);
  return context ? resolveCompositionLayout(composition, context) : composition;
}

function repairCompositionCapabilityDuration(
  composition: ProjectComposition,
  capabilities: EffectCapabilityCandidate[],
): { value: ProjectComposition; changed: boolean } {
  if (capabilities.length === 0) return { value: composition, changed: false };
  const byId = new Map(capabilities.map((candidate) => [`${candidate.familyId}:${candidate.variantId}`, candidate]));
  let changed = false;
  const value = {
    ...composition,
    effects: composition.effects.map((effect) => {
      const candidate = byId.get(`${effect.familyId}:${effect.variantId}`);
      if (!candidate || candidate.timingCapabilities?.includes('persistent') || candidate.timingCapabilities?.includes('item-reveal')) return effect;
      const duration = effect.time.endSec - effect.time.startSec;
      const boundedDuration = Math.min(Math.max(duration, candidate.minDurationSec), candidate.maxDurationSec);
      if (boundedDuration === duration) return effect;
      const endSec = Math.min(composition.project.durationSec, effect.time.startSec + boundedDuration);
      const startSec = endSec - boundedDuration >= 0 ? effect.time.startSec : Math.max(0, endSec - boundedDuration);
      if (startSec === effect.time.startSec && endSec === effect.time.endSec) return effect;
      changed = true;
      return { ...effect, time: { startSec, endSec } };
    }),
  };
  return { value, changed };
}

function getCandidateIndexes(input: unknown): CandidateIndexes | undefined {
  if (!input || typeof input !== 'object' || !('candidateIndexes' in input)) return undefined;
  return (input as { candidateIndexes?: CandidateIndexes }).candidateIndexes;
}

function parseJson(raw: string): unknown {
  const trimmed = raw.trim();
  const withoutFence = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try {
    return JSON.parse(withoutFence) as unknown;
  } catch {
    const start = withoutFence.indexOf('{');
    const end = withoutFence.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    try {
      return JSON.parse(withoutFence.slice(start, end + 1)) as unknown;
    } catch {
      return null;
    }
  }
}

function summarizeSchemaIssues(error: { issues: Array<{ path: PropertyKey[]; code: string }> }): string {
  return error.issues
    .slice(0, 8)
    .map((issue) => `${issue.path.map(String).join('.') || '<root>'}:${issue.code}`)
    .join(',');
}

function clampCompositionTiming(input: unknown): { value: unknown; changed: boolean } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { value: input, changed: false };
  const next = structuredClone(input) as Record<string, unknown>;
  const project = next.project;
  if (!project || typeof project !== 'object' || Array.isArray(project)) return { value: next, changed: false };
  const duration = (project as Record<string, unknown>).durationSec;
  if (typeof duration !== 'number' || !Number.isFinite(duration) || duration <= 0) return { value: next, changed: false };
  let changed = false;
  const segments = next.segments;
  if (Array.isArray(segments)) {
    next.segments = segments.map((segment) => {
      if (!segment || typeof segment !== 'object' || Array.isArray(segment)) return segment;
      const result = clampRange(segment as Record<string, unknown>, duration);
      changed ||= result.changed;
      return result.value;
    });
  }
  const effects = next.effects;
  if (Array.isArray(effects)) {
    next.effects = effects.map((effect) => {
      if (!effect || typeof effect !== 'object' || Array.isArray(effect)) return effect;
      const effectRecord = effect as Record<string, unknown>;
      const time = effectRecord.time;
      if (!time || typeof time !== 'object' || Array.isArray(time)) return effect;
      const result = clampRange(time as Record<string, unknown>, duration);
      changed ||= result.changed;
      return { ...effectRecord, time: result.value };
      });
  }
  const subtitles = next.subtitles;
  if (Array.isArray(subtitles)) {
    next.subtitles = subtitles.map((subtitle) => {
      if (!subtitle || typeof subtitle !== 'object' || Array.isArray(subtitle)) return subtitle;
      const result = clampRange(subtitle as Record<string, unknown>, duration);
      changed ||= result.changed;
      return result.value;
    });
  }
  return { value: next, changed };
}

function clampRange(value: Record<string, unknown>, duration: number): { value: Record<string, unknown>; changed: boolean } {
  if (typeof value.startSec !== 'number' || typeof value.endSec !== 'number') return { value, changed: false };
  const maxStart = Math.max(0, duration - 0.001);
  const startSec = Math.min(Math.max(value.startSec, 0), maxStart);
  const endSec = Math.min(Math.max(value.endSec, startSec + 0.001), duration);
  const changed = startSec !== value.startSec || endSec !== value.endSec;
  return { value: changed ? { ...value, startSec, endSec } : value, changed };
}
