import { effectRegistry, type EffectDefinition } from './registry';

export interface EffectTemplateDefinition extends EffectDefinition {
  effectTemplateId: string;
  rendererId: string;
  layout: EffectTemplateLayout;
}

export interface EffectTemplateLayout {
  defaultSize: [number, number];
  minSize: [number, number];
  maxSize: [number, number];
  preferredZones: string[];
  autoHeight: boolean;
  aspectBehavior: 'fixed' | 'content';
}

function isEffectTemplate(effect: EffectDefinition): boolean {
  return effect.category === undefined || effect.category === 'pack-effect';
}

function normalizedVariantId(variantId: string): string {
  return variantId.replace(/^pack:/, '');
}

function layoutFor(effect: EffectDefinition): EffectTemplateLayout {
  const tags = [...effect.semanticTags, ...(effect.visualTags ?? []), effect.familyId].map((tag) => tag.toLowerCase());
  if (tags.some((tag) => ['quote', 'quotation'].includes(tag))) return { defaultSize: [0.4, 0.22], minSize: [0.28, 0.16], maxSize: [0.6, 0.42], preferredZones: ['center', 'lower-left', 'lower-right'], autoHeight: true, aspectBehavior: 'content' };
  if (tags.some((tag) => ['list', 'steps', 'checklist', 'process', 'flow'].includes(tag))) return { defaultSize: [0.34, 0.24], minSize: [0.24, 0.16], maxSize: [0.5, 0.5], preferredZones: ['upper-left', 'lower-left'], autoHeight: true, aspectBehavior: 'content' };
  if (tags.some((tag) => ['chart', 'bars', 'graph'].includes(tag))) return { defaultSize: [0.36, 0.22], minSize: [0.26, 0.14], maxSize: [0.52, 0.38], preferredZones: ['upper-right', 'lower-right'], autoHeight: false, aspectBehavior: 'fixed' };
  if (tags.some((tag) => ['metric', 'number', 'ratio', 'kpi', 'percentage'].includes(tag))) return { defaultSize: [0.24, 0.18], minSize: [0.18, 0.12], maxSize: [0.42, 0.3], preferredZones: ['upper-right', 'lower-right'], autoHeight: false, aspectBehavior: 'fixed' };
  if (tags.some((tag) => ['highlight', 'callout', 'pointer', 'emphasis'].includes(tag))) return { defaultSize: [0.32, 0.14], minSize: [0.22, 0.1], maxSize: [0.5, 0.26], preferredZones: ['mid-left', 'mid-right', 'center'], autoHeight: true, aspectBehavior: 'content' };
  return { defaultSize: [0.3, 0.14], minSize: [0.2, 0.1], maxSize: [0.5, 0.3], preferredZones: ['upper-left', 'upper-right', 'lower-left', 'lower-right'], autoHeight: true, aspectBehavior: 'content' };
}

function toEffectTemplate(effect: EffectDefinition): EffectTemplateDefinition {
  const variantId = normalizedVariantId(effect.variantId);
  return {
    ...effect,
    effectTemplateId: `${effect.familyId}:${variantId}`,
    rendererId: effect.familyId,
    layout: layoutFor(effect),
  };
}

export const effectTemplateRegistry: EffectTemplateDefinition[] = effectRegistry.filter(isEffectTemplate).map(toEffectTemplate);

export function findEffectTemplate(familyId: string, variantId?: string): EffectTemplateDefinition | undefined {
  if (variantId === undefined) return effectTemplateRegistry.find((template) => template.effectTemplateId === familyId || template.familyId === familyId || template.variantId === familyId || normalizedVariantId(template.variantId) === familyId);
  return effectTemplateRegistry.find((template) => template.familyId === familyId && normalizedVariantId(template.variantId) === normalizedVariantId(variantId));
}

export function findEffectTemplateById(effectId: string): EffectTemplateDefinition | undefined {
  return effectTemplateRegistry.find((template) => normalizedVariantId(template.variantId) === effectId || template.id === effectId);
}
