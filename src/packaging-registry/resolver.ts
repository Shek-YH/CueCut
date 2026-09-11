import { packagingEffectCatalog } from './catalog';
import type { PackagingEffectManifest } from './manifest';
import type { PackagingTemplateQuery } from '../packaging-ir/schema';

export type RegistryTemplateQuery = PackagingTemplateQuery;

export const registryScoreWeights = {
  category: 30,
  style: 15,
  aspectRatio: 15,
  zone: 10,
  subjectRelation: 10,
  duration: 10,
  contentSchema: 10,
} as const;

export const templateQueryScoreWeights = {
  semanticRole: 20,
  visualIntent: 12,
  tags: 12,
  contentSlots: 10,
  itemCount: 8,
  durationRangeSec: 8,
  persistence: 8,
  preferredZones: 5,
} as const;

export interface RegistryResolveRequest {
  category: PackagingEffectManifest['category'];
  visualStyle: string;
  energy: number;
  subjectRelation: PackagingEffectManifest['subjectRelations'][number];
  preferredZones: PackagingEffectManifest['supportedZones'];
  aspectRatio: string;
  durationSec: number;
  requiredContentSlots: string[];
  excludeEffectIds?: string[];
  templateQuery?: RegistryTemplateQuery;
  /** Accepted as untrusted hints for backwards-compatible callers; never used as a selection bypass. */
  effectId?: string;
  templateId?: string;
}

export interface RegistryCandidate {
  effect: PackagingEffectManifest;
  score: number;
  reasons: string[];
}

function normalized(value: string): string {
  return value.trim().toLowerCase();
}

const packagingContentSlotAliases: Record<string, string> = {
  label: 'headline',
  headline: 'headline',
  titletext: 'headline',
  quotetext: 'headline',
  text: 'text',
  value: 'value',
  primaryvalue: 'value',
  valuetext: 'value',
  items: 'items',
  steps: 'items',
  entries: 'items',
};

export function normalizePackagingContentSlot(slot: string): string {
  const trimmedSlot = slot.trim();
  return packagingContentSlotAliases[trimmedSlot.toLowerCase()] ?? trimmedSlot;
}

function normalizedContentSlots(slots: string[]): string[] {
  return [...new Set(slots.map(normalizePackagingContentSlot))];
}

function inferredSemanticRoles(effect: PackagingEffectManifest): string[] {
  const key = normalized([effect.category, effect.title, ...effect.tags].join(' '));
  if (/quote|keypoint|term|definition/.test(key)) return ['quote', 'definition', 'conclusion'];
  if (/versus|comparison|beforeafter/.test(key)) return ['comparison'];
  if (/step|flow|process|timeline|checklist|milestone|list/.test(key)) return ['ordered-process'];
  if (/alert|causeeffect|warning|pain/.test(key)) return ['pain-point'];
  if (effect.category === 'stat') return ['evidence'];
  return ['neutral'];
}

function templateRequirementsSatisfied(effect: PackagingEffectManifest, request: RegistryResolveRequest): boolean {
  const query = request.templateQuery;
  const requiredContentSlots = normalizedContentSlots([...request.requiredContentSlots, ...(query?.requiredContentSlots ?? [])]);
  if (requiredContentSlots.some((slot) => !Object.hasOwn(effect.contentSchema, slot))) return false;
  if (query?.itemCount !== undefined && (!effect.itemCountRange || query.itemCount < effect.itemCountRange[0] || query.itemCount > effect.itemCountRange[1])) return false;
  if (query?.persistence && (!effect.persistenceModes || !effect.persistenceModes.includes(query.persistence))) return false;
  if (query?.durationRangeSec && (query.durationRangeSec[1] < effect.duration.min || query.durationRangeSec[0] > effect.duration.max)) return false;
  return true;
}

function scoreEffect(effect: PackagingEffectManifest, request: RegistryResolveRequest): RegistryCandidate {
  const reasons: string[] = [];
  let score = 0;
  if (effect.category === request.category) { score += registryScoreWeights.category; reasons.push('category'); }
  const normalizedStyle = normalized(request.visualStyle);
  if (effect.tags.some((tag) => tag.toLowerCase() === normalizedStyle || tag.toLowerCase().includes(normalizedStyle))) { score += registryScoreWeights.style; reasons.push('style'); }
  if (effect.supportedAspectRatios.includes(request.aspectRatio)) { score += registryScoreWeights.aspectRatio; reasons.push('aspectRatio'); }
  if (effect.supportedZones.some((zone) => request.preferredZones.includes(zone))) { score += registryScoreWeights.zone; reasons.push('zone'); }
  if (effect.subjectRelations.includes(request.subjectRelation)) { score += registryScoreWeights.subjectRelation; reasons.push('subjectRelation'); }
  if (request.durationSec >= effect.duration.min && request.durationSec <= effect.duration.max) { score += registryScoreWeights.duration; reasons.push('duration'); }
  const requiredContentSlots = normalizedContentSlots(request.requiredContentSlots);
  if (requiredContentSlots.every((slot) => Object.hasOwn(effect.contentSchema, slot))) { score += registryScoreWeights.contentSchema; reasons.push('contentSchema'); }

  const query = request.templateQuery;
  if (query?.semanticRole && (effect.semanticRoles ?? inferredSemanticRoles(effect)).some((role) => normalized(role) === normalized(query.semanticRole!))) {
    score += templateQueryScoreWeights.semanticRole;
    reasons.push('semanticRole');
  }
  if (query?.visualIntent && (effect.visualIntents ?? [...effect.tags, effect.title]).some((value) => normalized(value).includes(normalized(query.visualIntent!)) || normalized(query.visualIntent!).includes(normalized(value)))) {
    score += templateQueryScoreWeights.visualIntent;
    reasons.push('visualIntent');
  }
  if (query?.tags?.length) {
    const effectTags = new Set(effect.tags.map(normalized));
    const matches = query.tags.filter((tag) => [...effectTags].some((effectTag) => effectTag === normalized(tag) || effectTag.includes(normalized(tag)) || normalized(tag).includes(effectTag))).length;
    if (matches > 0) {
      score += templateQueryScoreWeights.tags * matches / query.tags.length;
      reasons.push('tags');
    }
  }
  if (query?.requiredContentSlots?.length && normalizedContentSlots(query.requiredContentSlots).every((slot) => Object.hasOwn(effect.contentSchema, slot))) {
    score += templateQueryScoreWeights.contentSlots;
    reasons.push('contentSlots');
  }
  if (query?.itemCount !== undefined && (!effect.itemCountRange || (query.itemCount >= effect.itemCountRange[0] && query.itemCount <= effect.itemCountRange[1]))) {
    score += templateQueryScoreWeights.itemCount;
    reasons.push('itemCount');
  }
  if (query?.durationRangeSec && query.durationRangeSec[0] <= effect.duration.max && query.durationRangeSec[1] >= effect.duration.min) {
    score += templateQueryScoreWeights.durationRangeSec;
    reasons.push('durationRangeSec');
  }
  if (query?.persistence && (!effect.persistenceModes || effect.persistenceModes.includes(query.persistence))) {
    score += templateQueryScoreWeights.persistence;
    reasons.push('persistence');
  }
  if (query?.preferredZones?.length && effect.supportedZones.some((zone) => query.preferredZones!.includes(zone))) {
    score += templateQueryScoreWeights.preferredZones;
    reasons.push('preferredZones');
  }
  return { effect, score, reasons };
}

export function resolvePackagingEffect(request: RegistryResolveRequest, catalog = packagingEffectCatalog): { selected?: RegistryCandidate; candidates: RegistryCandidate[] } {
  const candidates = catalog
    .filter((effect) => templateRequirementsSatisfied(effect, request))
    .map((effect) => scoreEffect(effect, request))
    .sort((left, right) => right.score - left.score || left.effect.id.localeCompare(right.effect.id));
  const excluded = new Set(request.excludeEffectIds ?? []);
  return { selected: candidates.find((candidate) => !excluded.has(candidate.effect.id)) ?? candidates[0], candidates };
}
