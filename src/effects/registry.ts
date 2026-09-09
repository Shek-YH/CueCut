import { motionRegistry, type MotionDefinition, type MotionSourceReference } from '../motions/registry';
import type { MotionParameterSet } from '../motions/format';

export interface EffectDefinition {
  id?: string;
  familyId: string;
  variantId: string;
  displayName: string;
  category?: string;
  adapterId?: string;
  semanticTags: string[];
  contentSlots: string[];
  minDurationSec: number;
  maxDurationSec: number;
  supportedAspectRatios: string[];
  recommendedMotionCategories: string[];
  recommendedSfxIntents: string[];
  assetSource?: string;
  license?: 'MIT';
  defaultProps?: MotionParameterSet;
  useCases?: string[];
  avoidCases?: string[];
  supportedStyles?: string[];
  supportedMotions?: string[];
  timingCapabilities?: string[];
  layoutCapabilities?: string[];
  source?: string;
  sourceRef?: MotionSourceReference;
  licenseRef?: string;
}

const legacyEffectRegistry: EffectDefinition[] = [
  { familyId: 'emphasis-marker', variantId: 'asterisk', displayName: 'Asterisk Emphasis Marker', semanticTags: ['emphasis', 'marker'], contentSlots: ['color'], minDurationSec: 0.2, maxDurationSec: 2, supportedAspectRatios: ['16:9', '9:16', '1:1'], recommendedMotionCategories: ['pop', 'fade'], recommendedSfxIntents: ['emphasis'], assetSource: '测试素材与api/CueCut_测试素材与api_2026-09-07/01-emphasis-marker-asterisk/assets/asterisk.svg', license: 'MIT' },
  { familyId: 'underline-highlight', variantId: 'highlighter', displayName: 'Highlighter Accent', semanticTags: ['underline', 'highlight'], contentSlots: ['text', 'highlightColor'], minDurationSec: 0.2, maxDurationSec: 2, supportedAspectRatios: ['16:9', '9:16', '1:1'], recommendedMotionCategories: ['soft-slide', 'fade'], recommendedSfxIntents: ['emphasis'], assetSource: '测试素材与api/CueCut_测试素材与api_2026-09-07/02-underline-highlight-highlighter/assets/highlighter.svg', license: 'MIT' },
  { familyId: 'title-pop-in', variantId: 'card-heading', displayName: 'Card Heading Pop-in', semanticTags: ['title', 'heading'], contentSlots: ['titleText', 'subtitleText'], minDurationSec: 0.4, maxDurationSec: 3, supportedAspectRatios: ['16:9', '9:16', '1:1'], recommendedMotionCategories: ['pop', 'spring'], recommendedSfxIntents: ['impact'], assetSource: '测试素材与api/CueCut_测试素材与api_2026-09-07/03-title-pop-in-card-heading/assets/card-heading.svg', license: 'MIT' },
  { familyId: 'number-stat-card', variantId: 'bar-chart-line', displayName: 'Stat Card Bar Accent', semanticTags: ['number', 'statistic', 'data'], contentSlots: ['labelText', 'valueText', 'unitText'], minDurationSec: 0.5, maxDurationSec: 4, supportedAspectRatios: ['16:9', '9:16', '1:1'], recommendedMotionCategories: ['count-up', 'pop'], recommendedSfxIntents: ['data'], assetSource: '测试素材与api/CueCut_测试素材与api_2026-09-07/04-number-stat-card-bar-chart/assets/bar-chart-line.svg', license: 'MIT' },
  { familyId: 'quote-callout', variantId: 'quote', displayName: 'Quote Callout Accent', semanticTags: ['quote', 'callout'], contentSlots: ['quoteText', 'attributionText'], minDurationSec: 0.5, maxDurationSec: 4, supportedAspectRatios: ['16:9', '9:16', '1:1'], recommendedMotionCategories: ['soft-slide', 'fade'], recommendedSfxIntents: ['emphasis'], assetSource: '测试素材与api/CueCut_测试素材与api_2026-09-07/05-quote-callout-quote/assets/quote.svg', license: 'MIT' },
  { familyId: 'pointer', variantId: 'cursor', displayName: 'Cursor Pointer', semanticTags: ['arrow', 'pointer', 'spotlight'], contentSlots: ['targetX', 'targetY'], minDurationSec: 0.3, maxDurationSec: 4, supportedAspectRatios: ['16:9', '9:16', '1:1'], recommendedMotionCategories: ['soft-slide', 'wiggle'], recommendedSfxIntents: ['click'], assetSource: '测试素材与api/CueCut_测试素材与api_2026-09-07/06-arrow-pointer-cursor/assets/cursor.svg', license: 'MIT' },
  { familyId: 'lower-third', variantId: 'layout-text-window', displayName: 'Layout Lower Third', semanticTags: ['lower-third', 'name', 'caption'], contentSlots: ['titleText', 'subtitleText'], minDurationSec: 0.6, maxDurationSec: 5, supportedAspectRatios: ['16:9', '9:16', '1:1'], recommendedMotionCategories: ['soft-slide', 'fade'], recommendedSfxIntents: ['transition'], assetSource: '测试素材与api/CueCut_测试素材与api_2026-09-07/07-lower-third-layout/assets/layout-text-window-reverse.svg', license: 'MIT' },
  { familyId: 'chapter-divider', variantId: 'dash', displayName: 'Chapter Divider Line', semanticTags: ['chapter', 'divider', 'transition'], contentSlots: ['chapterText'], minDurationSec: 0.4, maxDurationSec: 4, supportedAspectRatios: ['16:9', '9:16', '1:1'], recommendedMotionCategories: ['soft-slide', 'fade'], recommendedSfxIntents: ['transition'], assetSource: '测试素材与api/CueCut_测试素材与api_2026-09-07/08-chapter-divider-dash/assets/dash-lg.svg', license: 'MIT' },
  { familyId: 'subtitle-decoration', variantId: 'chat', displayName: 'Subtitle Chat Decoration', semanticTags: ['subtitle', 'chat', 'caption'], contentSlots: ['subtitleText'], minDurationSec: 0.2, maxDurationSec: 3, supportedAspectRatios: ['16:9', '9:16', '1:1'], recommendedMotionCategories: ['fade', 'soft-slide'], recommendedSfxIntents: ['click'], assetSource: '测试素材与api/CueCut_测试素材与api_2026-09-07/09-subtitle-decoration-chat/assets/chat-left-text.svg', license: 'MIT' },
  { familyId: 'particle-accent', variantId: 'sparkles', displayName: 'Sparkles Accent', semanticTags: ['particle', 'sparkle', 'accent'], contentSlots: ['color', 'seed'], minDurationSec: 0.3, maxDurationSec: 3, supportedAspectRatios: ['16:9', '9:16', '1:1'], recommendedMotionCategories: ['twinkle', 'fade'], recommendedSfxIntents: ['emphasis'], assetSource: '测试素材与api/CueCut_测试素材与api_2026-09-07/10-particle-accent-sparkles/assets/sparkles.svg', license: 'MIT' },
  { familyId: 'numeric', variantId: 'ring-a', displayName: '指标环 A', semanticTags: ['number', 'ratio', 'kpi'], contentSlots: ['label', 'value', 'maximum', 'decimals'], minDurationSec: 0.8, maxDurationSec: 8, supportedAspectRatios: ['16:9', '9:16'], recommendedMotionCategories: ['spring', 'pop'], recommendedSfxIntents: ['data'] },
  { familyId: 'numeric', variantId: 'ring-b', displayName: '指标环 B', semanticTags: ['number', 'ratio', 'kpi'], contentSlots: ['label', 'value', 'maximum', 'decimals'], minDurationSec: 0.8, maxDurationSec: 8, supportedAspectRatios: ['16:9', '9:16'], recommendedMotionCategories: ['spring', 'pop'], recommendedSfxIntents: ['data'] },
  { familyId: 'numeric', variantId: 'ring-c', displayName: '指标环 C', semanticTags: ['number', 'ratio', 'kpi'], contentSlots: ['label', 'value', 'maximum', 'decimals'], minDurationSec: 0.8, maxDurationSec: 8, supportedAspectRatios: ['16:9', '9:16'], recommendedMotionCategories: ['spring', 'pop'], recommendedSfxIntents: ['data'] },
];

function contentSlotsFor(category: string): string[] {
  if (category === 'text') return ['text'];
  if (category === 'number') return ['value', 'startValue', 'decimalPlaces', 'prefix', 'suffix'];
  if (category === 'list') return ['items', 'itemGap', 'stagger'];
  return [];
}

function sfxIntentsFor(category: string): string[] {
  if (category === 'number') return ['data'];
  if (category === 'list') return ['transition'];
  if (category === 'motion-layer') return ['transition'];
  return ['emphasis'];
}

function asFormalEffect(motion: MotionDefinition): EffectDefinition {
  const category = motion.category;
  return {
    id: motion.id,
    familyId: category,
    variantId: motion.motionId,
    displayName: motion.displayName ?? motion.motionId,
    category,
    adapterId: motion.adapterId,
    semanticTags: motion.semanticTags ?? [],
    contentSlots: contentSlotsFor(category),
    minDurationSec: motion.durationRangeSec[0],
    maxDurationSec: motion.durationRangeSec[1],
    supportedAspectRatios: motion.supportedAspectRatios ?? ['16:9', '9:16', '1:1'],
    recommendedMotionCategories: [category],
    recommendedSfxIntents: sfxIntentsFor(category),
    license: motion.license,
    defaultProps: motion.defaultProps,
    useCases: motion.useCases,
    avoidCases: motion.avoidCases,
    supportedStyles: motion.supportedStyles,
    supportedMotions: motion.supportedMotions,
    timingCapabilities: motion.timingCapabilities,
    layoutCapabilities: motion.layoutCapabilities,
    source: motion.source,
    sourceRef: motion.sourceRef,
    licenseRef: motion.licenseRef,
  };
}

const formalEffectRegistry = motionRegistry.filter((motion) => motion.adapter).map(asFormalEffect);

const registeredLegacyEffectRegistry = legacyEffectRegistry.map((effect) => ({
  ...effect,
  id: `${effect.familyId}:${effect.variantId}`,
}));

export const effectRegistry: EffectDefinition[] = [...registeredLegacyEffectRegistry, ...formalEffectRegistry];

export function findEffectDefinition(familyId: string, variantId?: string): EffectDefinition | undefined {
  if (variantId === undefined) {
    return effectRegistry.find((effect) => effect.id === familyId || `${effect.familyId}:${effect.variantId}` === familyId || effect.variantId === familyId);
  }
  return effectRegistry.find((effect) => effect.familyId === familyId && effect.variantId === variantId);
}

export function isKnownEffectCandidate(familyId: string, variantId?: string): boolean {
  return Boolean(findEffectDefinition(familyId, variantId));
}

export function migrateVariantContent(input: {
  familyId: string;
  fromVariantId: string;
  toVariantId: string;
  content: Record<string, unknown>;
  variantStateCache: Record<string, Record<string, unknown>>;
}): { content: Record<string, unknown>; variantStateCache: Record<string, Record<string, unknown>> } {
  const from = findEffectDefinition(input.familyId, input.fromVariantId);
  const to = findEffectDefinition(input.familyId, input.toVariantId);
  if (!from || !to) throw new Error('Variant must be registered');
  if (from.familyId !== to.familyId) throw new Error('Variant migration must stay within one family');

  return {
    content: { ...input.content },
    variantStateCache: {
      ...input.variantStateCache,
      [input.fromVariantId]: { ...input.content },
    },
  };
}
