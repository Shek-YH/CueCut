import type { EffectDefinition } from '../effects/registry';
import type { EffectCapabilityCandidate, EffectDataContract, EffectDataContractKind } from './types';

export interface EffectContentValidationIssue {
  code: string;
  path: string[];
  message: string;
}

export function createEffectCapability(effect: Pick<EffectDefinition, 'familyId' | 'variantId' | 'displayName' | 'semanticTags' | 'visualTags' | 'contentSlots' | 'minDurationSec' | 'maxDurationSec' | 'supportedAspectRatios' | 'useCases' | 'avoidCases' | 'timingCapabilities' | 'layoutCapabilities' | 'recommendedMotionCategories' | 'recommendedSfxIntents'>): EffectCapabilityCandidate {
  const dataContract = createDataContract(effect);
  return {
    familyId: effect.familyId,
    variantId: effect.variantId,
    displayName: effect.displayName,
    semanticTags: [...effect.semanticTags],
    visualTags: effect.visualTags ? [...effect.visualTags] : undefined,
    contentSlots: [...effect.contentSlots],
    minDurationSec: effect.minDurationSec,
    maxDurationSec: effect.maxDurationSec,
    supportedAspectRatios: [...effect.supportedAspectRatios],
    useCases: effect.useCases ? [...effect.useCases] : undefined,
    avoidCases: effect.avoidCases ? [...effect.avoidCases] : undefined,
    timingCapabilities: effect.timingCapabilities ? [...effect.timingCapabilities] : [...effect.recommendedMotionCategories],
    layoutCapabilities: effect.layoutCapabilities ? [...effect.layoutCapabilities] : undefined,
    dataContract,
  };
}

export function validateEffectContent(candidate: EffectCapabilityCandidate, content: Record<string, unknown>): EffectContentValidationIssue[] {
  const issues: EffectContentValidationIssue[] = [];
  for (const slot of candidate.dataContract.requiredSlots) {
    if (!(slot in content)) issues.push({ code: 'required_slot_missing', path: [slot], message: `Required content slot is missing: ${slot}` });
  }
  for (const slot of candidate.dataContract.numericSlots) {
    if (!(slot in content)) continue;
    const value = content[slot];
    if (typeof value !== 'number' && !(typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value)))) {
      issues.push({ code: 'numeric_value_required', path: [slot], message: `Numeric content is required for ${slot}` });
    }
  }
  for (const slot of candidate.dataContract.itemSlots) {
    if (!(slot in content)) continue;
    if (!Array.isArray(content[slot]) || content[slot].some((item) => typeof item !== 'string')) {
      issues.push({ code: 'items_required', path: [slot], message: `String items are required for ${slot}` });
    }
  }
  if (candidate.dataContract.provenanceRequired && content.provenance === undefined) {
    issues.push({ code: 'provenance_required', path: ['provenance'], message: 'Data provenance is required for this capability' });
  } else if (candidate.dataContract.provenanceRequired) {
    const provenance = content.provenance;
    const source = provenance && typeof provenance === 'object' && !Array.isArray(provenance)
      ? (provenance as Record<string, unknown>).source
      : undefined;
    if (source !== 'srt' && source !== 'user' && source !== 'project-data') {
      issues.push({ code: 'provenance_source_invalid', path: ['provenance', 'source'], message: 'Numeric/data provenance must be srt, user, or project-data' });
    }
  }
  return issues;
}

function createDataContract(effect: Pick<EffectDefinition, 'familyId' | 'semanticTags' | 'visualTags' | 'contentSlots'>): EffectDataContract {
  const tags = [...effect.semanticTags, ...(effect.visualTags ?? []), effect.familyId].map((value) => value.toLowerCase());
  const numeric = tags.some((tag) => ['numeric', 'number', 'percentage', 'ratio', 'kpi', 'metric', 'progress', 'chart', 'data'].includes(tag));
  const steps = tags.some((tag) => ['steps', 'checklist', 'process', 'flow'].includes(tag));
  const list = steps || tags.some((tag) => ['list', 'ranking'].includes(tag));
  const kind: EffectDataContractKind = numeric
    ? tags.includes('percentage') ? 'percentage' : tags.includes('progress') ? 'progress' : tags.includes('chart') || tags.includes('data') ? 'chart' : 'numeric'
    : tags.some((tag) => ['quote', 'quotation'].includes(tag)) ? 'quote'
      : tags.some((tag) => ['comparison', 'beforeafter', 'versus'].includes(tag)) ? 'comparison'
        : steps ? 'steps' : list ? 'list' : effect.contentSlots.includes('text') ? 'text' : 'text';
  const numericSlots = numeric ? effect.contentSlots.filter((slot) => ['value', 'maximum', 'startValue', 'percentage', 'amount', 'decimals'].includes(slot)) : [];
  if (numeric && !numericSlots.includes('value')) numericSlots.unshift('value');
  const itemSlots = list ? effect.contentSlots.filter((slot) => ['items', 'steps', 'entries'].includes(slot)) : [];
  if (list && !itemSlots.includes('items')) itemSlots.push('items');
  const requiredSlots = kind === 'quote' ? ['quoteText'] : kind === 'comparison' ? ['before', 'after'] : kind === 'text' ? effect.contentSlots.filter((slot) => slot === 'text') : kind === 'numeric' || kind === 'percentage' || kind === 'progress' || kind === 'chart' ? numericSlots.slice(0, 1) : itemSlots.slice(0, 1);
  return { kind, requiredSlots, numericSlots, itemSlots, provenanceRequired: numeric || kind === 'comparison' || kind === 'chart' };
}
