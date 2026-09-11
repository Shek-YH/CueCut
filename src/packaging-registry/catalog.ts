import { packMotionCatalog } from '../motions/packCatalog';
import { packagingCategories, type PackagingPlan } from '../packaging-ir/schema';
import { packagingEffectManifestSchema, type PackagingEffectManifest } from './manifest';

type PackagingCategory = (typeof packagingCategories)[number];

function categoryFor(entry: (typeof packMotionCatalog)[number]): PackagingCategory {
  const key = `${entry.family} ${entry.effectFamilyId} ${entry.semanticTags.join(' ')}`.toLowerCase();
  if (/lowerthird|nameplate/.test(key)) return 'lower-third';
  if (/quote|keypoint|definition|term|keyword/.test(key)) return 'quote';
  if (/percentage|number|metric|kpi|delta|price|date|trend|gauge|progress|ranking|chart|bar|funnel/.test(key)) return 'stat';
  if (/code|terminal|command|keyboard/.test(key)) return 'code';
  if (/notification|alert|status|loading/.test(key)) return 'notification';
  if (/social|engagement|reaction|badge|tag|emoji/.test(key)) return 'social-card';
  if (/app|window|browser|desktop|laptop|mobile|device|screen|clipboard/.test(key)) return 'picture-in-picture';
  if (/highlight|underline|focus|spotlight|attention|pointer|cursor|callout/.test(key)) return 'ui-highlight';
  if (/chapter|timeline|milestone|transition|flow|steps|checklist/.test(key)) return 'transition';
  return 'callout';
}

function manifestFor(entry: (typeof packMotionCatalog)[number]): PackagingEffectManifest {
  const category = categoryFor(entry);
  const key = `${entry.family} ${entry.semanticTags.join(' ')} ${entry.visualTags.join(' ')}`.toLowerCase();
  const supportsCueTimes = entry.motionCategory.toLowerCase() === 'liststagger' || /list|steps/.test(key);
  const semanticRoles = /quote|keypoint|term|definition/.test(key)
    ? ['quote', 'definition', 'conclusion']
    : /versus|comparison|beforeafter/.test(key)
      ? ['comparison']
      : /step|flow|process|timeline|checklist|milestone/.test(key)
        ? ['ordered-process']
        : /alert|causeeffect|pain|warning/.test(key)
          ? ['pain-point']
          : category === 'stat' ? ['evidence'] : ['neutral'];
  const visualIntents = [
    ...entry.useCases,
    ...(supportsCueTimes ? ['progressive-explanation'] : []),
    ...(category === 'quote' ? ['emphasize-contrast'] : []),
  ];
  const visualTags = new Set(entry.visualTags.map((tag) => tag.toLowerCase()));
  const contentSchema: Record<string, string> = {};
  if (visualTags.has('text') || visualTags.has('card')) Object.assign(contentSchema, { text: 'string', title: 'string', headline: 'string', supportingText: 'string' });
  if (visualTags.has('list') || visualTags.has('steps')) Object.assign(contentSchema, { title: 'string', items: 'string[]' });
  if (visualTags.has('chart') || visualTags.has('metric')) Object.assign(contentSchema, { value: 'string', headline: 'string' });
  if (supportsCueTimes) contentSchema.cueTimes = 'number[]';
  return packagingEffectManifestSchema.parse({
    id: entry.id.startsWith('cuecut-') ? entry.id : `cuecut-${entry.id}`,
    version: entry.packVersion,
    category,
    title: entry.displayName,
    tags: [...new Set([entry.family, ...entry.semanticTags, ...entry.visualTags])],
    semanticRoles,
    visualIntents,
    itemCountRange: supportsCueTimes ? [2, 32] : [1, 1],
    persistenceModes: supportsCueTimes ? ['section', 'chapter', 'persistent'] : ['transient', 'section'],
    supportsCueTimes,
    supportedAspectRatios: entry.supportedAspectRatios,
    supportedZones: ['upper-left', 'upper-right', 'mid-left', 'mid-right', 'lower-left', 'lower-right', 'center'],
    subjectRelations: ['avoid', 'foreground', 'ignore'],
    duration: { min: entry.durationRangeSec[0], recommended: Math.max(entry.durationRangeSec[0], Math.min(entry.durationRangeSec[1], 2)), max: entry.durationRangeSec[1] },
    motionCapabilities: { entrance: ['fade_in', 'slide_left', 'scale_punch'], emphasis: ['none', 'glow', 'scale_pulse'], exit: ['fade_out', 'scale_out'] },
    contentSchema,
    safeZoneAware: true,
    subtitleAware: true,
    subjectAware: true,
    runtime: 'canvas',
    license: entry.license,
    licenseRef: entry.licenseRef,
  });
}

export const packagingEffectCatalog: PackagingEffectManifest[] = packMotionCatalog.map(manifestFor);
export const packagingCategoriesInCatalog = new Set(packagingEffectCatalog.map((effect) => effect.category));

export function findPackagingEffect(id: string): PackagingEffectManifest | undefined {
  return packagingEffectCatalog.find((effect) => effect.id === id);
}

export function catalogSupportsAspectRatio(aspectRatio: PackagingPlan['canvas']['aspectRatio']): PackagingEffectManifest[] {
  return packagingEffectCatalog.filter((effect) => effect.supportedAspectRatios.includes(aspectRatio));
}
