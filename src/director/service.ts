import { projectCompositionSchema, type ProjectComposition } from '../project/schema';
import { createOneCallGuard } from './oneCallGuard';
import { assertCompositionCandidateIds, sanitizeCompositionCandidateIds, type CandidateIndexes } from './validator';

export interface DirectorResult {
  composition: ProjectComposition;
  usedFallback: boolean;
  warnings: string[];
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
        };
      }

      const timingWarnings = timingRepair.changed ? ['Director timing locally clamped'] : [];

      const candidateIndexes = getCandidateIndexes(input);
      if (candidateIndexes) {
        try {
          assertCompositionCandidateIds(result.data, candidateIndexes);
        } catch (error) {
          const sanitized = sanitizeCompositionCandidateIds(result.data, candidateIndexes);
          return { composition: sanitized.composition, usedFallback: true, warnings: [...timingWarnings, ...(sanitized.warnings.length ? sanitized.warnings : [error instanceof Error ? error.message : 'Director candidate validation failed'])] };
        }
      }

      return { composition: result.data, usedFallback: false, warnings: timingWarnings };
    },
  };
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
