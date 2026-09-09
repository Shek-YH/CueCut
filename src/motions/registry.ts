import {
  motionAdapterRegistry,
  motionLayerPresetIds,
  findMotionAdapter,
  type CueCutMotionAdapter,
} from './adapters';
import type { MotionCategory, MotionParameterSet } from './format';
import { packMotionCatalog } from './packCatalog';

export type MotionLicense = 'MIT' | 'PROJECT-LOCAL' | 'Apache-2.0' | 'BSD-2-Clause' | 'BSD-3-Clause' | 'CC-BY-4.0';

export interface MotionSourceReference {
  provider: string;
  url: string;
  files: string[];
}

export interface MotionCapabilities {
  timing: string[];
  layout: string[];
}

export interface MotionDefinition {
  id: string;
  motionId: string;
  role: 'enter' | 'exit' | 'both';
  category: string;
  intensity: number;
  durationRangeSec: [number, number];
  recommendedEffectFamilies: string[];
  effectFamilyId?: string;
  displayName?: string;
  adapterId?: string;
  adapter?: CueCutMotionAdapter;
  semanticTags?: string[];
  visualTags?: string[];
  useCases?: string[];
  avoidCases?: string[];
  defaultProps?: MotionParameterSet;
  supportedAspectRatios?: string[];
  timingCapabilities?: string[];
  layoutCapabilities?: string[];
  capabilities?: MotionCapabilities;
  supportedStyles?: string[];
  supportedMotions?: string[];
  source?: string;
  sourceRef?: MotionSourceReference;
  license?: MotionLicense;
  licenseRef?: string;
}

const supportedAspectRatios = ['16:9', '9:16', '1:1'];
const timingCapabilities = ['delay', 'duration', 'enter', 'exit', 'deterministic-frame'];
const baseLayoutCapabilities = ['normalized-position', 'scale', 'opacity'];
const motionLayerLayoutCapabilities = [...baseLayoutCapabilities, 'translate', 'rotation'];
const blurLayoutCapabilities = [...motionLayerLayoutCapabilities, 'blur'];

const motionPrimitivesSource: MotionSourceReference = {
  provider: 'Motion Primitives',
  url: 'https://github.com/ibelick/motion-primitives',
  files: ['src/motions/_import/CueCut2_TalkingHead_Effects_Pack_v0.1/01_Text_Emphasis/motion-primitives', 'src/motions/_import/CueCut2_TalkingHead_Effects_Pack_v0.1/02_Numbers_Metrics/motion-primitives', 'src/motions/_import/CueCut2_TalkingHead_Effects_Pack_v0.1/04_Motion_Presets/motion-primitives/animated-group.tsx'],
};

const magicUiSource: MotionSourceReference = {
  provider: 'Magic UI',
  url: 'https://github.com/magicuidesign/magicui',
  files: ['src/motions/_import/CueCut2_TalkingHead_Effects_Pack_v0.1/01_Text_Emphasis/magicui', 'src/motions/_import/CueCut2_TalkingHead_Effects_Pack_v0.1/02_Numbers_Metrics/magicui', 'src/motions/_import/CueCut2_TalkingHead_Effects_Pack_v0.1/03_List_Steps/magicui/animated-list.tsx'],
};

const sourceFor = (adapterId: string): { source: MotionSourceReference; licenseRef: string } => {
  const magicUiIds = new Set(['animated-shiny-text', 'number-ticker', 'animated-list']);
  const source = magicUiIds.has(adapterId) ? magicUiSource : motionPrimitivesSource;
  const licenseRef = magicUiIds.has(adapterId)
    ? 'src/motions/licenses/magicui-LICENSE.md'
    : 'src/motions/licenses/motion-primitives-LICENCE.md';
  return { source, licenseRef };
};

function displayNameFor(adapterId: string): string {
  const names: Record<string, string> = {
    'text-morph': 'Text Morph',
    'text-roll': 'Text Roll',
    'text-scramble': 'Text Scramble',
    'text-shimmer': 'Text Shimmer',
    'animated-shiny-text': 'Animated Shiny Text',
    'animated-number': 'Animated Number',
    'number-ticker': 'Number Ticker',
    'animated-list': 'Animated List',
    'animated-group': 'Animated Group',
    fade: 'Fade',
    slide: 'Slide',
    scale: 'Scale',
    blur: 'Blur',
    'blur-slide': 'Blur Slide',
    zoom: 'Zoom',
    flip: 'Flip',
    bounce: 'Bounce',
    rotate: 'Rotate',
    swing: 'Swing',
  };
  return names[adapterId] ?? adapterId;
}

function semanticTagsFor(category: MotionCategory, adapterId: string): string[] {
  if (category === 'text') return ['text', 'emphasis', adapterId];
  if (category === 'number') return ['number', 'metric', adapterId];
  if (category === 'list') return ['list', 'steps', adapterId];
  return ['motion', 'layer', adapterId];
}

function useCasesFor(category: MotionCategory): string[] {
  if (category === 'text') return ['KeyPoint', 'Keyword', 'Quote', 'Definition', 'Conclusion'];
  if (category === 'number') return ['BigNumber', 'Percentage', 'Delta', 'Price', 'Progress', 'Metric'];
  if (category === 'list') return ['BulletList', 'Steps', 'Checklist', 'FeatureList', 'Tips'];
  return ['text entrance', 'text exit', 'layer transition'];
}

function avoidCasesFor(category: MotionCategory): string[] {
  if (category === 'text') return ['long paragraphs', 'dense multi-line copy'];
  if (category === 'number') return ['non-numeric content'];
  if (category === 'list') return ['using as a semantic Checklist without list content'];
  return ['rapid stacking of multiple high-intensity layers'];
}

function layoutFor(adapterId: string, category: MotionCategory): string[] {
  if (category !== 'motion-layer') return baseLayoutCapabilities;
  return adapterId === 'blur' || adapterId === 'blur-slide' ? blurLayoutCapabilities : motionLayerLayoutCapabilities;
}

function formalDefinition(adapter: CueCutMotionAdapter): MotionDefinition {
  const category = adapter.category;
  const sourceInfo = sourceFor(adapter.id);
  const layoutCapabilities = layoutFor(adapter.id, category);
  const timing = [...timingCapabilities];
  return {
    id: adapter.id,
    motionId: adapter.id,
    role: 'both',
    category,
    intensity: category === 'motion-layer' && ['bounce', 'rotate', 'flip'].includes(adapter.id) ? 0.75 : 0.4,
    durationRangeSec: category === 'number' ? [0.4, 4] : category === 'list' ? [0.3, 3] : [0.2, 1.5],
    recommendedEffectFamilies: category === 'motion-layer' ? ['*'] : [category],
    effectFamilyId: category,
    displayName: displayNameFor(adapter.id),
    adapterId: adapter.id,
    adapter,
    semanticTags: semanticTagsFor(category, adapter.id),
    visualTags: category === 'text' ? ['Text'] : category === 'number' ? ['Number', 'Counter'] : category === 'list' ? ['List', 'Steps'] : ['MotionLayer'],
    useCases: useCasesFor(category),
    avoidCases: avoidCasesFor(category),
    defaultProps: adapter.defaultProps,
    supportedAspectRatios,
    timingCapabilities: timing,
    layoutCapabilities,
    capabilities: { timing, layout: layoutCapabilities },
    supportedStyles: ['dark', 'light', '中文', 'English'],
    supportedMotions: [adapter.id],
    source: sourceInfo.source.provider,
    sourceRef: sourceInfo.source,
    license: 'MIT',
    licenseRef: sourceInfo.licenseRef,
  };
}

const formalMotionDefinitions = motionAdapterRegistry.filter((adapter) => adapter.category !== 'pack-effect').map(formalDefinition);

const packMotionDefinitions: MotionDefinition[] = packMotionCatalog.map((entry) => {
  const adapter = findMotionAdapter(entry.adapterId);
  if (!adapter) throw new Error(`Motion adapter must be registered: ${entry.adapterId}`);
  const timing = ['delay', 'duration', 'enter', 'exit', 'deterministic-frame'];
  const layout = ['normalized-position', 'scale', 'opacity', 'translate', 'rotation'];
  return {
    id: entry.adapterId,
    motionId: entry.adapterId,
    role: 'both',
    category: 'pack-effect',
    effectFamilyId: entry.effectFamilyId,
    intensity: 0.5,
    durationRangeSec: entry.durationRangeSec,
    recommendedEffectFamilies: [entry.effectFamilyId],
    displayName: entry.displayName,
    adapterId: entry.adapterId,
    adapter,
    semanticTags: entry.semanticTags,
    visualTags: entry.visualTags,
    useCases: entry.useCases,
    avoidCases: entry.avoidCases,
    defaultProps: adapter.defaultProps,
    supportedAspectRatios: entry.supportedAspectRatios,
    timingCapabilities: timing,
    layoutCapabilities: layout,
    capabilities: { timing, layout },
    supportedStyles: ['dark', 'light', '中文', 'English'],
    supportedMotions: [entry.adapterId],
    source: entry.source,
    sourceRef: { provider: entry.packId, url: `local://${entry.packId}`, files: [entry.sourceRef] },
    license: entry.license,
    licenseRef: entry.licenseRef,
  };
});

function legacy(definition: Omit<MotionDefinition, 'id'>): MotionDefinition {
  return { ...definition, id: definition.motionId };
}

const legacyMotionDefinitions: MotionDefinition[] = [
  legacy({ motionId: 'scale-in', role: 'enter', category: 'basic', intensity: 0.35, durationRangeSec: [0.2, 1.2], recommendedEffectFamilies: ['*'] }),
  legacy({ motionId: 'spring-in', role: 'enter', category: 'spring', intensity: 0.55, durationRangeSec: [0.25, 1.2], recommendedEffectFamilies: ['numeric', 'title-pop-in'] }),
  legacy({ motionId: 'pop', role: 'enter', category: 'spring', intensity: 0.65, durationRangeSec: [0.15, 0.8], recommendedEffectFamilies: ['numeric', 'emphasis-marker'] }),
  legacy({ motionId: 'soft-slide', role: 'both', category: 'direction', intensity: 0.3, durationRangeSec: [0.2, 1.2], recommendedEffectFamilies: ['quote', 'lower-third'] }),
  legacy({ motionId: 'fly-right', role: 'enter', category: 'direction', intensity: 0.7, durationRangeSec: [0.25, 1.4], recommendedEffectFamilies: ['comparison', 'pointer'] }),
  legacy({ motionId: 'fly-left', role: 'exit', category: 'direction', intensity: 0.7, durationRangeSec: [0.25, 1.4], recommendedEffectFamilies: ['comparison', 'pointer'] }),
  legacy({ motionId: 'scale-fade-out', role: 'exit', category: 'basic', intensity: 0.35, durationRangeSec: [0.2, 1.2], recommendedEffectFamilies: ['*'] }),
  legacy({ motionId: 'spin-360', role: 'enter', category: 'rotation', intensity: 0.85, durationRangeSec: [0.35, 1.3], recommendedEffectFamilies: ['emphasis-marker'] }),
  legacy({ motionId: 'spin-720', role: 'enter', category: 'rotation', intensity: 1, durationRangeSec: [0.45, 1.6], recommendedEffectFamilies: ['emphasis-marker'] }),
  legacy({ motionId: 'shrink', role: 'exit', category: 'basic', intensity: 0.45, durationRangeSec: [0.2, 1.2], recommendedEffectFamilies: ['*'] }),
  legacy({ motionId: 'spin-out', role: 'exit', category: 'rotation', intensity: 0.85, durationRangeSec: [0.35, 1.3], recommendedEffectFamilies: ['emphasis-marker'] }),
];

export const motionRegistry: MotionDefinition[] = [...formalMotionDefinitions, ...packMotionDefinitions, ...legacyMotionDefinitions];

export const motionDefinitions = motionRegistry;

export function findMotion(motionId: string): MotionDefinition | undefined {
  return motionRegistry.find((motion) => motion.motionId === motionId || motion.id === motionId);
}

export const findMotionDefinition = findMotion;

export function findAdapterForMotion(motionId: string): CueCutMotionAdapter | undefined {
  return findMotionAdapter(findMotion(motionId)?.adapterId ?? motionId);
}

export function isMotionCompatible(effectFamilyId: string, motionId: string, role?: 'enter' | 'exit'): boolean {
  const motion = findMotion(motionId);
  if (!motion) return false;
  if (role && motion.role !== 'both' && motion.role !== role) return false;
  return motion.recommendedEffectFamilies.includes('*') || motion.recommendedEffectFamilies.includes(effectFamilyId);
}

export { motionLayerPresetIds };
export { contentMotionAdapterRegistry, motionAdapterRegistry, motionLayerAdapterRegistry, findMotionAdapter, evaluateMotionAdapterAtFrame, evaluateAdapterAtFrame } from './adapters';
