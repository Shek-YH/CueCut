import { z } from 'zod';

export const packagingCategories = [
  'kinetic-type', 'stat', 'lower-third', 'callout', 'quote', 'data-card', 'chart', 'progress', 'code',
  'ui-highlight', 'notification', 'social-card', 'picture-in-picture', 'logo-reveal', 'headline',
  'freeze-frame-dressing', 'transition',
] as const;

export const subjectRelations = ['avoid', 'foreground', 'behind', 'hug-left', 'hug-right', 'hero-center', 'ignore'] as const;
export const placementZones = ['upper-left', 'upper-right', 'mid-left', 'mid-right', 'center', 'lower-left', 'lower-right', 'top', 'bottom'] as const;
export const entranceMotions = ['fade_in', 'fade_blur', 'slide_left', 'slide_right', 'slide_top', 'slide_bottom', 'wipe_left', 'wipe_right', 'scale_grow', 'scale_punch', 'word_reveal', 'typewriter', 'slam'] as const;
export const emphasisMotions = ['none', 'scale_pulse', 'shake', 'glow', 'color_shift', 'underline_sweep', 'highlight_sweep', 'counter', 'bar_fill', 'scribble'] as const;
export const exitMotions = ['fade_out', 'slide_out_left', 'slide_out_right', 'slide_out_bottom', 'scale_out', 'wipe_out'] as const;
export const cameraMotions = ['punch_in', 'slow_zoom', 'pan', 'dolly_zoom', 'rack_focus', 'freeze_frame'] as const;
export const exportFormats = ['mp4', 'webm-alpha', 'mov-alpha', 'png-sequence'] as const;
export const semanticRoles = ['hook', 'pain-point', 'evidence', 'definition', 'comparison', 'ordered-process', 'quote', 'conclusion', 'neutral'] as const;
export const evidenceTypes = ['none', 'number', 'comparison', 'quote', 'list', 'process', 'screenshot', 'highlight'] as const;
export const correctionTypes = ['none', 'homophone', 'asr-recognition', 'duplicate-word', 'punctuation', 'segmentation', 'english-normalization', 'number-normalization', 'proper-noun', 'context-repair', 'uncertain'] as const;
export const persistenceModes = ['transient', 'section', 'chapter', 'persistent'] as const;

const normalizedRectSchema = z.object({
  x: z.number().finite().min(0).max(1),
  y: z.number().finite().min(0).max(1),
  width: z.number().finite().positive().max(1),
  height: z.number().finite().positive().max(1),
}).strict();

const edgeInsetsSchema = z.object({
  top: z.number().finite().min(0).max(0.5),
  bottom: z.number().finite().min(0).max(0.5),
  left: z.number().finite().min(0).max(0.5),
  right: z.number().finite().min(0).max(0.5),
}).strict();

const motionIntentSchema = z.object({
  entrance: z.enum(entranceMotions),
  emphasis: z.enum(emphasisMotions),
  exit: z.enum(exitMotions),
  camera: z.enum(cameraMotions).optional(),
}).strict();

const placementIntentSchema = z.object({
  preferredZones: z.array(z.enum(placementZones)).min(1).max(4),
  subjectRelation: z.enum(subjectRelations),
  anchor: z.enum(['scene-safe', 'canvas', 'subtitle-safe']),
}).strict();

const constraintsSchema = z.object({
  maxLines: z.number().int().positive().max(8),
  mustRemainReadable: z.boolean(),
  mayOverlapSubtitle: z.boolean(),
}).strict();

const cadenceSchema = z.object({
  stepMs: z.number().finite().min(0).max(120000).optional(),
  staggerMs: z.number().finite().min(0).max(120000).optional(),
  emphasisAtMs: z.number().finite().min(0).max(120000).optional(),
  cueOffsetsMs: z.array(z.number().finite().min(0).max(120000)).max(32).optional(),
}).strict();

const templateQuerySchema = z.object({
  semanticRole: z.enum(semanticRoles).optional(),
  visualIntent: z.string().min(1).max(120).optional(),
  tags: z.array(z.string().min(1).max(64)).max(24).optional(),
  itemCount: z.number().int().positive().max(32).optional(),
  requiredContentSlots: z.array(z.string().min(1).max(64)).max(24).optional(),
  durationRangeSec: z.tuple([z.number().finite().min(0), z.number().finite().min(0)]).optional(),
  preferredZones: z.array(z.enum(placementZones)).max(4).optional(),
}).strict().superRefine((value, context) => {
  if (value.durationRangeSec && value.durationRangeSec[1] < value.durationRangeSec[0]) context.addIssue({ code: 'custom', path: ['durationRangeSec', 1], message: 'duration max must be >= min' });
});

const visualValueSchema = z.union([z.boolean(), z.number().finite().min(0).max(1)]);

function legacyCategory(value: unknown): (typeof packagingCategories)[number] {
  const normalized = String(value ?? '').toLowerCase();
  if (packagingCategories.includes(normalized as (typeof packagingCategories)[number])) return normalized as (typeof packagingCategories)[number];
  if (/number|metric|stat|percentage/.test(normalized)) return 'stat';
  if (/quote/.test(normalized)) return 'quote';
  if (/headline|title|text/.test(normalized)) return 'headline';
  if (/process|ordered|steps|list/.test(normalized)) return 'progress';
  return 'callout';
}

function legacyContent(item: Record<string, unknown>): Record<string, unknown> {
  if (item.content && typeof item.content === 'object' && !Array.isArray(item.content)) return item.content as Record<string, unknown>;
  const elements = Array.isArray(item.elements) ? item.elements : [];
  const text = elements.map((element) => {
    if (typeof element === 'string' || typeof element === 'number') return String(element);
    if (element && typeof element === 'object' && !Array.isArray(element)) {
      const value = element as Record<string, unknown>;
      return String(value.text ?? value.label ?? value.value ?? '');
    }
    return '';
  }).filter(Boolean).join(' ');
  return { text: text || String(item.text ?? item.title ?? item.type ?? '包装重点') };
}

function normalizeLegacyTimelineItem(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const raw = value as Record<string, unknown>;
  const hasLegacyShape = raw.type !== undefined || raw.elements !== undefined;
  if (!hasLegacyShape) return value;
  const { type: _type, elements: _elements, ...rest } = raw;
  return {
    ...rest,
    category: raw.category ?? legacyCategory(raw.type),
    content: legacyContent(raw),
    intent: typeof raw.intent === 'string' ? raw.intent : String(raw.type ?? 'highlight_key_claim'),
    importance: typeof raw.importance === 'number' ? raw.importance : 0.5,
    visualIntent: raw.visualIntent ?? { style: 'clean-tech', energy: 0.5, emphasis: 'normal' },
    motionIntent: raw.motionIntent ?? { entrance: 'fade_in', emphasis: 'none', exit: 'fade_out' },
    placementIntent: raw.placementIntent ?? { preferredZones: ['upper-left'], subjectRelation: 'avoid', anchor: 'scene-safe' },
    constraints: raw.constraints ?? { maxLines: 2, mustRemainReadable: true, mayOverlapSubtitle: false },
  };
}

const timelineItemCoreSchema = z.object({
  id: z.string().min(1).max(160),
  chapterId: z.string().min(1).max(160).optional(),
  sectionId: z.string().min(1).max(160).optional(),
  sourceSubtitleIds: z.array(z.string().min(1).max(160)).max(256).optional(),
  sequence: z.number().int().positive().max(10000).optional(),
  semanticRole: z.enum(semanticRoles).optional(),
  evidenceType: z.enum(evidenceTypes).optional(),
  selectionReason: z.string().min(1).max(500).optional(),
  visualValue: visualValueSchema.optional(),
  layer: z.number().int().min(0).max(3).optional(),
  persistence: z.enum(persistenceModes).optional(),
  templateQuery: templateQuerySchema.optional(),
  cueTimesSec: z.array(z.number().finite().min(0).max(86400)).max(32).optional(),
  dimAtSec: z.number().finite().min(0).max(86400).optional(),
  cadence: cadenceSchema.optional(),
  startSec: z.number().finite().min(0),
  endSec: z.number().finite().min(0),
  intent: z.string().min(1).max(500),
  category: z.enum(packagingCategories),
  content: z.record(z.string(), z.unknown()),
  importance: z.number().finite().min(0).max(1),
  visualIntent: z.object({ style: z.string().min(1).max(120), energy: z.number().finite().min(0).max(1), emphasis: z.enum(['soft', 'normal', 'strong']) }).strict(),
  motionIntent: motionIntentSchema,
  placementIntent: placementIntentSchema,
  constraints: constraintsSchema,
  userOverride: z.object({ locked: z.boolean(), zone: z.enum(placementZones).optional() }).strict().optional(),
}).strict().superRefine((value, context) => {
  if (value.endSec <= value.startSec) context.addIssue({ code: 'custom', path: ['endSec'], message: 'endSec must be greater than startSec' });
  if (value.cueTimesSec && value.cueTimesSec.some((cue) => cue < value.startSec || cue > value.endSec)) context.addIssue({ code: 'custom', path: ['cueTimesSec'], message: 'cueTimesSec must be within item time range' });
});

const timelineItemSchema = z.preprocess(normalizeLegacyTimelineItem, timelineItemCoreSchema);

const transcriptRepairSegmentSchema = z.object({
  id: z.string().min(1).max(160),
  startSec: z.number().finite().min(0),
  endSec: z.number().finite().min(0),
  originalText: z.string(),
  correctedText: z.string(),
  correctionType: z.enum(correctionTypes),
  confidence: z.number().finite().min(0).max(1),
  needsReview: z.boolean(),
}).strict().superRefine((value, context) => {
  if (value.endSec <= value.startSec) context.addIssue({ code: 'custom', path: ['endSec'], message: 'endSec must be greater than startSec' });
});

const chapterSchema = z.object({
  id: z.string().min(1).max(160),
  title: z.string().min(1).max(160),
  summary: z.string().min(1).max(1000),
  startSec: z.number().finite().min(0),
  endSec: z.number().finite().min(0),
  sourceSubtitleIds: z.array(z.string().min(1).max(160)).max(256),
  semanticRole: z.enum(semanticRoles),
}).strict().superRefine((value, context) => {
  if (value.endSec <= value.startSec) context.addIssue({ code: 'custom', path: ['endSec'], message: 'endSec must be greater than startSec' });
});

const sectionSchema = z.object({
  id: z.string().min(1).max(160),
  chapterId: z.string().min(1).max(160),
  title: z.string().min(1).max(160),
  summary: z.string().min(1).max(1000),
  startSec: z.number().finite().min(0),
  endSec: z.number().finite().min(0),
  sourceSubtitleIds: z.array(z.string().min(1).max(160)).max(256),
  semanticRole: z.enum(semanticRoles),
  evidenceType: z.enum(evidenceTypes),
  keepForVisualPackaging: z.boolean(),
  visualValue: visualValueSchema,
  selectionReason: z.string().min(1).max(500),
  elementIds: z.array(z.string().min(1).max(160)).max(256),
  elements: z.array(timelineItemSchema).max(256).optional(),
}).strict().superRefine((value, context) => {
  if (value.endSec <= value.startSec) context.addIssue({ code: 'custom', path: ['endSec'], message: 'endSec must be greater than startSec' });
});

const visualUnitSchema = z.object({
  id: z.string().min(1).max(160),
  sectionId: z.string().min(1).max(160),
  kind: z.string().min(1).max(80),
  startSec: z.number().finite().min(0),
  endSec: z.number().finite().min(0),
  layer: z.number().int().min(0).max(3),
  persistence: z.enum(persistenceModes),
  sourceSubtitleIds: z.array(z.string().min(1).max(160)),
  summary: z.string().min(1).max(1000),
  selectionReason: z.string().min(1).max(500),
  visualIntent: z.union([z.string().min(1).max(120), timelineItemCoreSchema.shape.visualIntent]),
  content: z.record(z.string(), z.unknown()),
  cueTimesSec: z.array(z.number().finite().min(0).max(86400)).max(32),
  placement: placementIntentSchema,
  templateQuery: templateQuerySchema,
  visualValue: visualValueSchema.optional(),
  keepForVisualPackaging: z.boolean().optional(),
}).strict().superRefine((value, context) => {
  if (value.endSec <= value.startSec) context.addIssue({ code: 'custom', path: ['endSec'], message: 'endSec must be greater than startSec' });
  if (value.cueTimesSec.some((cue) => cue < value.startSec || cue > value.endSec)) context.addIssue({ code: 'custom', path: ['cueTimesSec'], message: 'cueTimesSec must be within unit time range' });
});

const planSchema = z.object({
  schemaVersion: z.union([z.literal('1.0'), z.literal(1)]).transform(() => '1.0' as const),
  projectId: z.string().min(1).max(160),
  canvas: z.object({ width: z.number().int().positive(), height: z.number().int().positive(), aspectRatio: z.string().min(1).max(32), fps: z.number().finite().positive().max(240) }).strict(),
  globalStyle: z.object({
    visualStyle: z.string().min(1).max(120),
    energy: z.number().finite().min(0).max(1),
    density: z.enum(['low', 'medium', 'high', 'auto']),
    paletteIntent: z.string().min(1).max(500),
    motionIntensity: z.number().finite().min(0).max(1),
  }).strict(),
  transcriptRepair: z.object({ segments: z.array(transcriptRepairSegmentSchema).max(10000) }).strict().optional(),
  chapters: z.array(chapterSchema).max(128).optional(),
  sections: z.array(sectionSchema).max(512).optional(),
  visualUnits: z.array(visualUnitSchema).max(2048).optional(),
  timeline: z.array(timelineItemSchema).max(4096),
  constraints: z.object({
    maxConcurrentOverlays: z.number().int().positive().max(32),
    allowBehindSubject: z.boolean(),
    subjectAvoidPadding: z.number().finite().min(0).max(0.5),
    edgeInsets: edgeInsetsSchema,
  }).strict(),
  exportHints: z.object({ formats: z.array(z.enum(exportFormats)).min(1), transparent: z.boolean() }).strict(),
}).strict();

export const packagingPlanSchema = planSchema;
export type PackagingPlan = z.infer<typeof packagingPlanSchema>;
export type PackagingTimelineItem = PackagingPlan['timeline'][number];
export type NormalizedPackagingRect = z.infer<typeof normalizedRectSchema>;
export type PackagingTranscriptRepairSegment = z.infer<typeof transcriptRepairSegmentSchema>;
export type PackagingChapter = z.infer<typeof chapterSchema>;
export type PackagingSection = z.infer<typeof sectionSchema>;
export type PackagingVisualUnit = z.infer<typeof visualUnitSchema>;
