import type { TranscriptInput } from './types';

export interface GroundingUnit {
  id: string;
  sourceSubtitleIds: string[];
  keyClaim?: string;
  evidenceText?: string;
  visualValue?: boolean | number;
  content?: Record<string, unknown>;
}

export interface GroundingIssue {
  unitId: string;
  code: string;
  message: string;
}

export interface GroundingResult {
  acceptedUnitIds: string[];
  droppedUnitIds: string[];
  fatal: GroundingIssue[];
  warnings: GroundingIssue[];
}

function normalized(value: string): string {
  return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}%]+/gu, '');
}

function numberTokens(value: string): string[] {
  return value.match(/\d+(?:\.\d+)?%?/g) ?? [];
}

function overlapsEvidence(evidence: string, source: string): boolean {
  const normalizedEvidence = normalized(evidence);
  const normalizedSource = normalized(source);
  if (!normalizedEvidence || !normalizedSource) return false;
  if (normalizedSource.includes(normalizedEvidence) || normalizedEvidence.includes(normalizedSource)) return true;
  const chunks = evidence.split(/[，。！？；、,.;!?\s]+/u).map(normalized).filter((chunk) => chunk.length >= 2);
  return chunks.length > 0 && chunks.some((chunk) => normalizedSource.includes(chunk));
}

function isPlaceholder(value: string): boolean {
  return /^(包装重点|highlight|key point|重点)$/iu.test(value.trim());
}

function similarClaim(left: string, right: string): boolean {
  return normalized(left) === normalized(right);
}

export function validateVisualGrounding(units: GroundingUnit[], subtitles: TranscriptInput[]): GroundingResult {
  const subtitleById = new Map(subtitles.map((subtitle) => [subtitle.id, subtitle]));
  const result: GroundingResult = { acceptedUnitIds: [], droppedUnitIds: [], fatal: [], warnings: [] };
  let previousClaim: string | undefined;

  for (const unit of units) {
    const addFatal = (code: string, message: string) => result.fatal.push({ unitId: unit.id, code, message });
    const claim = unit.keyClaim?.trim() ?? '';
    const evidence = unit.evidenceText?.trim() ?? '';
    if (unit.visualValue === false || (typeof unit.visualValue === 'number' && unit.visualValue < 0.4)) {
      result.droppedUnitIds.push(unit.id);
      continue;
    }
    if (!claim || !evidence || unit.sourceSubtitleIds.length === 0) {
      addFatal('empty_visual_unit', 'Visual unit requires keyClaim, evidenceText, and sourceSubtitleIds');
      continue;
    }
    const sources = unit.sourceSubtitleIds.map((id) => subtitleById.get(id));
    if (sources.some((source) => !source)) {
      addFatal('unknown_source_subtitle', 'Every sourceSubtitleId must exist in the transcript');
      continue;
    }
    const sourceText = sources.map((source) => source!.text).join(' ');
    if (!overlapsEvidence(evidence, sourceText)) {
      addFatal('evidence_not_grounded', 'Evidence text has no substantive overlap with source subtitles');
      continue;
    }
    if (isPlaceholder(claim)) {
      addFatal('placeholder_claim', 'Generic placeholder claims cannot enter the runtime');
      continue;
    }
    if (numberTokens(claim).some((token) => !normalized(sourceText).includes(normalized(token)))) {
      addFatal('number_not_grounded', 'Every number or percentage in keyClaim must appear in source subtitles');
      continue;
    }
    if (previousClaim && similarClaim(previousClaim, claim)) result.warnings.push({ unitId: unit.id, code: 'duplicate_adjacent_claim', message: 'Adjacent visual units repeat the same normalized claim' });
    previousClaim = claim;
    result.acceptedUnitIds.push(unit.id);
  }
  return result;
}
