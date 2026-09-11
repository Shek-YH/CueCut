import { createOneCallGuard } from '../director/oneCallGuard';
import { evidenceTypes, packagingCategories, packagingPlanSchema, persistenceModes, placementZones, semanticRoles, type PackagingPlan } from '../packaging-ir/schema';
import { PACKAGING_DIRECTOR_SYSTEM_PROMPT } from './prompt';

export type PackagingProvider = (input: { systemPrompt: string; request: unknown }) => Promise<unknown>;
type R = Record<string, unknown>;
type Role = (typeof semanticRoles)[number];
type Evidence = (typeof evidenceTypes)[number];
type Zone = (typeof placementZones)[number];
type Persistence = (typeof persistenceModes)[number];
type VisualValue = boolean | number;

export const LOW_VISUAL_VALUE_THRESHOLD = 0.25;

type IdNamespace = 'transcript' | 'chapter' | 'section' | 'element' | 'visualUnit' | 'timeline';
type IdReferences = Record<IdNamespace, Map<string, string>>;
type IdAllocator = { next: (prefix: string) => string; claim: (value: unknown, prefix: string) => string; hasDuplicates: boolean };

function createIdAllocator(value: unknown): IdAllocator {
  const reserved = new Set<string>();
  const counts = new Map<string, number>();
  const collect = (current: unknown): void => {
    if (Array.isArray(current)) {
      current.forEach(collect);
      return;
    }
    if (!current || typeof current !== 'object') return;
    for (const [key, entry] of Object.entries(current)) {
      if (key === 'id' && typeof entry === 'string' && entry.length > 0) {
        reserved.add(entry);
        counts.set(entry, (counts.get(entry) ?? 0) + 1);
      }
      collect(entry);
    }
  };
  collect(value);
  const used = new Set<string>();
  const next = (prefix: string): string => {
    let index = 1;
    let id = `${prefix}-${index}`;
    while (reserved.has(id) || used.has(id)) id = `${prefix}-${++index}`;
    used.add(id);
    return id;
  };
  return {
    hasDuplicates: [...counts.values()].some((count) => count > 1),
    next,
    claim(valueToClaim, prefix) {
      if (typeof valueToClaim === 'string' && valueToClaim.length > 0 && !used.has(valueToClaim)) {
        used.add(valueToClaim);
        return valueToClaim;
      }
      if (typeof valueToClaim === 'string' && valueToClaim.length > 0) {
        let suffix = 2;
        let id = `${valueToClaim}-${suffix}`;
        while (reserved.has(id) || used.has(id)) id = `${valueToClaim}-${++suffix}`;
        used.add(id);
        return id;
      }
      return next(prefix);
    },
  };
}

const record = (value: unknown): R => value && typeof value === 'object' && !Array.isArray(value) ? value as R : {};
const numberValue = (value: unknown): number | null => typeof value === 'number' && Number.isFinite(value) ? value : null;
const stringValue = (value: unknown): string | undefined => typeof value === 'string' && value.length > 0 ? value : undefined;
const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
const intClamp = (value: number, min: number, max: number): number => Math.round(clamp(value, min, max));
const numberArray = (value: unknown): number[] => Array.isArray(value) ? value.flatMap((entry) => numberValue(entry) === null ? [] : [numberValue(entry)!]) : [];

function createIdReferences(): IdReferences {
  return { transcript: new Map(), chapter: new Map(), section: new Map(), element: new Map(), visualUnit: new Map(), timeline: new Map() };
}

function rememberId(map: Map<string, string>, rawId: unknown, normalizedId: string): void {
  if (typeof rawId === 'string' && rawId.length > 0 && !map.has(rawId)) map.set(rawId, normalizedId);
}

function rewriteId(value: unknown, map: Map<string, string> | undefined): string | undefined {
  if (typeof value !== 'string' || value.length === 0) return undefined;
  return map?.get(value) ?? value;
}

function rewriteElementId(value: string, references: IdReferences): string {
  return references.visualUnit.get(value) ?? references.element.get(value) ?? references.timeline.get(value) ?? value;
}

function parseLocally(value: unknown): { value: unknown; repaired: boolean } {
  if (typeof value !== 'string') return { value, repaired: false };
  const fence = String.fromCharCode(96).repeat(3);
  const stripped = value.replace(new RegExp('^' + fence + '(?:json)?\\s*', 'i'), '').replace(new RegExp('\\s*' + fence + '$', 'i'), '').trim();
  try { return { value: JSON.parse(stripped), repaired: stripped !== value }; } catch {
    const start = stripped.indexOf('{');
    const end = stripped.lastIndexOf('}');
    if (start >= 0 && end > start) return { value: JSON.parse(stripped.slice(start, end + 1)), repaired: true };
    throw new Error('Packaging Director returned invalid JSON; no AI retry is allowed');
  }
}

type Context = { project: R; preferences: R; videoMeta: R; transcript: unknown[]; durationSec: number; width: number; height: number };

function buildContext(raw: R, request: unknown): Context {
  const input = record(request);
  const project = record(input.project);
  const analysis = record(input.analysis);
  const preferences = record(input.preferences);
  const videoMeta = record(analysis.videoMeta);
  const durationSec = numberValue(project.durationSec) ?? numberValue(videoMeta.durationSec) ?? 60;
  return {
    project, preferences, videoMeta,
    transcript: Array.isArray(analysis.transcript) ? analysis.transcript : Array.isArray(input.transcript) ? input.transcript : [],
    durationSec: Math.max(0.02, durationSec),
    width: numberValue(project.canvasWidth) ?? numberValue(videoMeta.width) ?? 1080,
    height: numberValue(project.canvasHeight) ?? numberValue(videoMeta.height) ?? 1920,
  };
}

function semanticRoleFor(value: unknown): Role | undefined {
  return semanticRoles.includes(value as Role) ? value as Role : undefined;
}

function evidenceTypeFor(value: unknown): Evidence | undefined {
  return evidenceTypes.includes(value as Evidence) ? value as Evidence : undefined;
}

function persistenceFor(value: unknown): Persistence | undefined {
  return persistenceModes.includes(value as Persistence) ? value as Persistence : undefined;
}

function categoryFor(value: unknown): (typeof packagingCategories)[number] {
  const normalized = String(value ?? '').toLowerCase();
  if (packagingCategories.includes(normalized as (typeof packagingCategories)[number])) return normalized as (typeof packagingCategories)[number];
  if (/comparison|versus|contrast/.test(normalized)) return 'data-card';
  if (/process|ordered|steps|checklist|list/.test(normalized)) return 'progress';
  if (/highlight|pointer|callout/.test(normalized)) return 'ui-highlight';
  if (/screenshot|screen|b-roll/.test(normalized)) return 'picture-in-picture';
  if (/headline|title|text/.test(normalized)) return 'headline';
  if (/number|metric|stat|percentage/.test(normalized)) return 'stat';
  if (/quote/.test(normalized)) return 'quote';
  if (/notification|alert/.test(normalized)) return 'notification';
  return 'callout';
}

function defaultZonesFor(role: Role | undefined, category: (typeof packagingCategories)[number]): Zone[] {
  if (role === 'hook' || role === 'quote' || role === 'conclusion' || category === 'quote' || category === 'headline') return ['center', 'upper-left'];
  if (role === 'evidence' || category === 'stat' || category === 'chart') return ['upper-right', 'lower-right'];
  if (role === 'ordered-process' || category === 'progress') return ['upper-left', 'upper-right'];
  if (role === 'comparison') return ['mid-left', 'mid-right'];
  if (role === 'pain-point') return ['lower-left', 'lower-right'];
  return ['upper-left', 'upper-right', 'lower-left', 'lower-right'];
}

function placementFor(value: unknown, role: Role | undefined, category: (typeof packagingCategories)[number]): R {
  const raw = record(value);
  const zones = Array.isArray(raw.preferredZones) ? raw.preferredZones.filter((zone): zone is Zone => placementZones.includes(zone as Zone)) : [];
  return {
    preferredZones: zones.length > 0 ? zones : defaultZonesFor(role, category),
    subjectRelation: ['avoid', 'foreground', 'behind', 'hug-left', 'hug-right', 'hero-center', 'ignore'].includes(String(raw.subjectRelation)) ? String(raw.subjectRelation) : 'avoid',
    anchor: ['scene-safe', 'canvas', 'subtitle-safe'].includes(String(raw.anchor)) ? String(raw.anchor) : 'scene-safe',
  };
}

function visualIntentFor(value: unknown, style: string, energy: number): R {
  const raw = record(value);
  return { style: stringValue(raw.style) ?? style, energy: clamp(numberValue(raw.energy) ?? energy, 0, 1), emphasis: raw.emphasis === 'soft' || raw.emphasis === 'strong' ? raw.emphasis : 'normal' };
}

function motionIntentFor(value: unknown): R {
  const raw = record(value);
  const entrances = ['fade_in', 'fade_blur', 'slide_left', 'slide_right', 'slide_top', 'slide_bottom', 'wipe_left', 'wipe_right', 'scale_grow', 'scale_punch', 'word_reveal', 'typewriter', 'slam'];
  const emphases = ['none', 'scale_pulse', 'shake', 'glow', 'color_shift', 'underline_sweep', 'highlight_sweep', 'counter', 'bar_fill', 'scribble'];
  const exits = ['fade_out', 'slide_out_left', 'slide_out_right', 'slide_out_bottom', 'scale_out', 'wipe_out'];
  const cameras = ['punch_in', 'slow_zoom', 'pan', 'dolly_zoom', 'rack_focus', 'freeze_frame'];
  return {
    entrance: entrances.includes(String(raw.entrance)) ? String(raw.entrance) : 'fade_in',
    emphasis: emphases.includes(String(raw.emphasis)) ? String(raw.emphasis) : 'none',
    exit: exits.includes(String(raw.exit)) ? String(raw.exit) : 'fade_out',
    ...(cameras.includes(String(raw.camera)) ? { camera: String(raw.camera) } : {}),
  };
}

function constraintsFor(value: unknown): R {
  const raw = record(value);
  return { maxLines: Number.isInteger(numberValue(raw.maxLines)) ? intClamp(numberValue(raw.maxLines)!, 1, 8) : 2, mustRemainReadable: raw.mustRemainReadable !== false, mayOverlapSubtitle: raw.mayOverlapSubtitle === true };
}

function contentFor(value: R): R {
  if (value.content && typeof value.content === 'object' && !Array.isArray(value.content)) return value.content as R;
  const values = Array.isArray(value.elements) ? value.elements : [];
  const text = values.map((entry) => {
    if (typeof entry === 'string' || typeof entry === 'number') return String(entry);
    const raw = record(entry);
    return stringValue(raw.text) ?? stringValue(raw.label) ?? stringValue(raw.value) ?? '';
  }).filter(Boolean).join(' ');
  return { text: text || stringValue(value.text) || stringValue(value.title) || stringValue(value.type) || '包装重点' };
}

function visualValueFor(value: unknown): VisualValue | undefined {
  if (value === true || value === false) return value;
  const number = numberValue(value);
  return number === null ? undefined : clamp(number, 0, 1);
}

function readableContent(value: R): string | undefined {
  for (const key of ['text', 'headline', 'title', 'value']) {
    if (typeof value[key] === 'string' && String(value[key]).trim()) return String(value[key]);
    if (typeof value[key] === 'number') return String(value[key]);
  }
  return undefined;
}

function subtitleIdsForRange(value: unknown, transcript: unknown[], startSec: number, endSec: number): string[] {
  if (Array.isArray(value)) {
    const explicit = value.filter((entry): entry is string => typeof entry === 'string');
    if (explicit.length > 0) return explicit;
  }
  return transcript.flatMap((entry) => {
    const raw = record(entry);
    const start = numberValue(raw.startSec) ?? numberValue(raw.start) ?? -1;
    const end = numberValue(raw.endSec) ?? numberValue(raw.end) ?? -1;
    const id = stringValue(raw.id) ?? stringValue(raw.segmentId) ?? stringValue(raw.subtitleId);
    return id && start < endSec && end > startSec ? [id] : [];
  });
}

function cadenceFor(value: unknown, cueTimesSec: number[], startSec: number, endSec: number): R | undefined {
  const raw = record(value);
  const cadence: R = {};
  const maxCueOffsetMs = Math.max(0, (endSec - startSec) * 1000);
  for (const key of ['stepMs', 'staggerMs', 'emphasisAtMs']) {
    const number = numberValue(raw[key]);
    if (number !== null) cadence[key] = clamp(number, 0, 120000);
  }
  const offsets = numberArray(raw.cueOffsetsMs);
  if (offsets.length > 0) cadence.cueOffsetsMs = offsets.map((offset) => clamp(offset, 0, maxCueOffsetMs)).slice(0, 32);
  else if (cueTimesSec.length > 0) cadence.cueOffsetsMs = cueTimesSec.map((cue) => clamp(Math.round((cue - startSec) * 1000), 0, 120000)).slice(0, 32);
  return Object.keys(cadence).length > 0 ? cadence : undefined;
}

function templateQueryFor(value: unknown, role: Role | undefined, visualIntent: unknown, category: (typeof packagingCategories)[number], content: R, zones: Zone[]): R {
  const raw = record(value);
  return {
    ...raw,
    ...(raw.semanticRole === undefined && role ? { semanticRole: role } : {}),
    ...(raw.visualIntent === undefined && typeof visualIntent === 'string' ? { visualIntent } : {}),
    ...(raw.tags === undefined ? { tags: [category] } : {}),
    ...(raw.requiredContentSlots === undefined ? { requiredContentSlots: Object.keys(content).slice(0, 24) } : {}),
    ...(raw.preferredZones === undefined ? { preferredZones: zones } : {}),
  };
}

function normalizeTranscriptRepair(value: unknown, context: Context, ids: IdAllocator, references: IdReferences): R {
  const values = Array.isArray(record(value).segments) ? record(value).segments as unknown[] : [];
  return { segments: values.flatMap((entry) => {
    const raw = record(entry);
    const id = ids.claim(raw.id, 'transcript');
    rememberId(references.transcript, raw.id, id);
    const startSec = clamp(numberValue(raw.startSec) ?? 0, 0, context.durationSec - 0.01);
    const endSec = clamp(numberValue(raw.endSec) ?? Math.min(context.durationSec, startSec + 0.01), startSec + 0.01, context.durationSec);
    return [{ id, startSec, endSec, originalText: stringValue(raw.originalText) ?? stringValue(raw.text) ?? '', correctedText: stringValue(raw.correctedText) ?? stringValue(raw.originalText) ?? stringValue(raw.text) ?? '', correctionType: ['none', 'homophone', 'asr-recognition', 'duplicate-word', 'punctuation', 'segmentation', 'english-normalization', 'number-normalization', 'proper-noun', 'context-repair', 'uncertain'].includes(String(raw.correctionType)) ? String(raw.correctionType) : 'uncertain', confidence: clamp(numberValue(raw.confidence) ?? 0.5, 0, 1), needsReview: raw.needsReview === true }];
  }) };
}

function normalizeTimelineItem(value: unknown, index: number, context: Context, inherited: R = {}, ids?: IdAllocator, references?: IdReferences, namespace: 'element' | 'timeline' = 'timeline'): R {
  const raw = record(value);
  const role = semanticRoleFor(raw.semanticRole ?? inherited.semanticRole);
  const evidence = evidenceTypeFor(raw.evidenceType ?? inherited.evidenceType);
  const category = categoryFor(raw.category ?? raw.kind ?? raw.type ?? inherited.category ?? evidence ?? role);
  const startSec = clamp(numberValue(raw.startSec) ?? numberValue(raw.start) ?? numberValue(inherited.startSec) ?? index * Math.min(8, context.durationSec), 0, context.durationSec - 0.01);
  const endSec = clamp(numberValue(raw.endSec) ?? numberValue(raw.end) ?? numberValue(inherited.endSec) ?? Math.min(context.durationSec, startSec + 3), startSec + 0.01, context.durationSec);
  const content = contentFor({ ...inherited, ...raw });
  const placement = placementFor(raw.placementIntent ?? raw.placement ?? inherited.placementIntent, role, category);
  const cueTimesSec = numberArray(raw.cueTimesSec).map((cue) => clamp(cue, startSec, endSec));
  const templateQuery = templateQueryFor(raw.templateQuery ?? inherited.templateQuery, role, raw.visualIntent ?? inherited.visualIntent, category, content, placement.preferredZones as Zone[]);
  const cadence = cadenceFor(raw.cadence ?? inherited.cadence, cueTimesSec, startSec, endSec);
  const id = ids?.claim(raw.id, 'overlay') ?? stringValue(raw.id) ?? 'overlay-' + (index + 1);
  const chapterId = rewriteId(raw.chapterId ?? inherited.chapterId, references?.chapter);
  const sectionId = rewriteId(raw.sectionId ?? inherited.sectionId, references?.section);
  const sourceSubtitleIds = subtitleIdsForRange(raw.sourceSubtitleIds ?? inherited.sourceSubtitleIds, context.transcript, startSec, endSec).map((sourceId) => references?.transcript.get(sourceId) ?? sourceId);
  if (references) rememberId(references[namespace], raw.id, id);
  const item: R = {
    id,
    ...(chapterId ? { chapterId } : {}),
    ...(sectionId ? { sectionId } : {}),
    sourceSubtitleIds,
    sequence: intClamp(numberValue(raw.sequence) ?? index + 1, 1, 10000),
    ...(role ? { semanticRole: role } : {}),
    ...(evidence ? { evidenceType: evidence } : {}),
    ...(stringValue(raw.selectionReason ?? inherited.selectionReason) ? { selectionReason: stringValue(raw.selectionReason ?? inherited.selectionReason) } : {}),
    ...(visualValueFor(raw.visualValue ?? inherited.visualValue) !== undefined ? { visualValue: visualValueFor(raw.visualValue ?? inherited.visualValue) } : {}),
    layer: intClamp(numberValue(raw.layer ?? inherited.layer) ?? 1, 0, 3),
    persistence: persistenceFor(raw.persistence ?? inherited.persistence) ?? 'transient',
    templateQuery,
    ...(cueTimesSec.length > 0 ? { cueTimesSec } : {}),
    ...(cadence ? { cadence } : {}),
    startSec, endSec,
    intent: stringValue(raw.intent) ?? stringValue(inherited.title) ?? stringValue(raw.type) ?? 'highlight_key_claim',
    category, content,
    importance: clamp(numberValue(raw.importance) ?? numberValue(inherited.importance) ?? 0.5, 0, 1),
    visualIntent: visualIntentFor(raw.visualIntent ?? inherited.visualIntent, stringValue(context.preferences.style) ?? 'clean-tech', numberValue(raw.energy ?? inherited.energy) ?? 0.5),
    motionIntent: motionIntentFor(raw.motionIntent ?? inherited.motionIntent),
    placementIntent: placement,
    constraints: constraintsFor(raw.constraints ?? inherited.constraints),
  };
  if (numberValue(raw.dimAtSec ?? inherited.dimAtSec) !== null) item.dimAtSec = clamp(numberValue(raw.dimAtSec ?? inherited.dimAtSec)!, 0, 86400);
  const override = record(raw.userOverride ?? inherited.userOverride);
  if (Object.keys(override).length > 0) item.userOverride = { locked: override.locked === true, ...(placementZones.includes(override.zone as Zone) ? { zone: override.zone } : {}) };
  return item;
}

function normalizeChapter(value: unknown, index: number, context: Context, ids: IdAllocator, references: IdReferences): R {
  const raw = record(value);
  const id = ids.claim(raw.id, 'chapter');
  rememberId(references.chapter, raw.id, id);
  const startSec = clamp(numberValue(raw.startSec) ?? numberValue(raw.start) ?? 0, 0, context.durationSec - 0.01);
  const endSec = clamp(numberValue(raw.endSec) ?? numberValue(raw.end) ?? Math.min(context.durationSec, startSec + 0.01), startSec + 0.01, context.durationSec);
  return { id, title: stringValue(raw.title) || 'Chapter ' + (index + 1), summary: stringValue(raw.summary) || stringValue(raw.title) || 'Chapter ' + (index + 1), startSec, endSec, sourceSubtitleIds: subtitleIdsForRange(raw.sourceSubtitleIds, context.transcript, startSec, endSec).map((sourceId) => references.transcript.get(sourceId) ?? sourceId), semanticRole: semanticRoleFor(raw.semanticRole) ?? 'neutral' };
}

function normalizeSection(value: unknown, index: number, context: Context, ids: IdAllocator, references: IdReferences): R {
  const raw = record(value);
  const id = ids.claim(raw.id, 'section');
  rememberId(references.section, raw.id, id);
  const startSec = clamp(numberValue(raw.startSec) ?? numberValue(raw.start) ?? 0, 0, context.durationSec - 0.01);
  const endSec = clamp(numberValue(raw.endSec) ?? numberValue(raw.end) ?? Math.min(context.durationSec, startSec + 0.01), startSec + 0.01, context.durationSec);
  const role = semanticRoleFor(raw.semanticRole) ?? 'neutral';
  const evidence = evidenceTypeFor(raw.evidenceType) ?? 'none';
  const source = Array.isArray(raw.elements) ? raw.elements : Array.isArray(raw.items) ? raw.items : [];
  const chapterId = rewriteId(raw.chapterId, references.chapter) ?? ids.next('chapter');
  const elements = source.map((entry, elementIndex) => normalizeTimelineItem(entry, elementIndex, context, { chapterId, sectionId: id, startSec, endSec, semanticRole: role, evidenceType: evidence, selectionReason: raw.selectionReason, visualValue: raw.visualValue, keepForVisualPackaging: raw.keepForVisualPackaging }, ids, references, 'element'));
  const elementIds = Array.isArray(raw.elementIds) ? raw.elementIds.filter((entry): entry is string => typeof entry === 'string') : elements.map((entry) => String(entry.id));
  return { id, chapterId, title: stringValue(raw.title) || stringValue(raw.summary) || 'Section ' + (index + 1), summary: stringValue(raw.summary) || stringValue(raw.title) || 'Section ' + (index + 1), startSec, endSec, sourceSubtitleIds: subtitleIdsForRange(raw.sourceSubtitleIds, context.transcript, startSec, endSec).map((sourceId) => references.transcript.get(sourceId) ?? sourceId), semanticRole: role, evidenceType: evidence, keepForVisualPackaging: raw.keepForVisualPackaging !== false, visualValue: raw.visualValue === false ? false : clamp(numberValue(raw.visualValue) ?? 1, 0, 1), selectionReason: stringValue(raw.selectionReason) || 'AI selected this section for visual packaging', elementIds, ...(elements.length > 0 ? { elements } : {}) };
}

function normalizeVisualUnit(value: unknown, context: Context, ids: IdAllocator, references: IdReferences): R {
  const raw = record(value);
  const id = ids.claim(raw.id, 'unit');
  rememberId(references.visualUnit, raw.id, id);
  const startSec = clamp(numberValue(raw.startSec) ?? numberValue(raw.start) ?? 0, 0, context.durationSec - 0.01);
  const endSec = clamp(numberValue(raw.endSec) ?? numberValue(raw.end) ?? Math.min(context.durationSec, startSec + 0.01), startSec + 0.01, context.durationSec);
  const role = semanticRoleFor(raw.semanticRole) ?? semanticRoleFor(record(raw.templateQuery).semanticRole);
  const category = categoryFor(raw.kind ?? raw.category ?? role);
  const content = contentFor(raw);
  const placement = placementFor(raw.placement ?? raw.placementIntent, role, category);
  const cueTimesSec = numberArray(raw.cueTimesSec).map((cue) => clamp(cue, startSec, endSec));
  const visualValue = visualValueFor(raw.visualValue);
  const sectionId = rewriteId(raw.sectionId, references.section) ?? 'section-1';
  return { id, sectionId, kind: stringValue(raw.kind) || category, startSec, endSec, layer: intClamp(numberValue(raw.layer) ?? 1, 0, 3), persistence: persistenceFor(raw.persistence) ?? 'transient', sourceSubtitleIds: subtitleIdsForRange(raw.sourceSubtitleIds, context.transcript, startSec, endSec).map((sourceId) => references.transcript.get(sourceId) ?? sourceId), summary: stringValue(raw.summary) || readableContent(content) || 'Visual packaging unit', selectionReason: stringValue(raw.selectionReason) || 'AI selected this visual unit', visualIntent: typeof raw.visualIntent === 'string' || (raw.visualIntent && typeof raw.visualIntent === 'object' && !Array.isArray(raw.visualIntent)) ? raw.visualIntent : 'emphasize-key-claim', content, cueTimesSec, placement, templateQuery: templateQueryFor(raw.templateQuery, role, raw.visualIntent, category, content, placement.preferredZones as Zone[]), ...(visualValue !== undefined ? { visualValue } : {}), ...(raw.keepForVisualPackaging !== undefined ? { keepForVisualPackaging: raw.keepForVisualPackaging === true } : {}) };
}

function keepVisual(item: R): boolean {
  return item.visualValue !== false && !(typeof item.visualValue === 'number' && item.visualValue < LOW_VISUAL_VALUE_THRESHOLD);
}

function keepVisualUnit(unit: R, section?: R): boolean {
  return unit.keepForVisualPackaging !== false && section?.keepForVisualPackaging !== false && keepVisual({
    ...unit,
    visualValue: unit.visualValue ?? section?.visualValue,
  });
}

function timelineItemFromUnit(unit: R, index: number, context: Context, section?: R): R {
  const templateQuery = record(unit.templateQuery);
  return normalizeTimelineItem({
    id: unit.id,
    chapterId: section?.chapterId,
    sectionId: unit.sectionId,
    semanticRole: section?.semanticRole ?? templateQuery.semanticRole,
    evidenceType: section?.evidenceType,
    startSec: unit.startSec,
    endSec: unit.endSec,
    layer: unit.layer,
    persistence: unit.persistence,
    sourceSubtitleIds: unit.sourceSubtitleIds,
    selectionReason: unit.selectionReason ?? section?.selectionReason,
    visualValue: unit.visualValue ?? section?.visualValue,
    cueTimesSec: unit.cueTimesSec,
    templateQuery: unit.templateQuery,
    visualIntent: unit.visualIntent,
    content: unit.content,
    placementIntent: unit.placement,
  }, index, context);
}

function repairPackagingPlan(value: unknown, request: unknown): { value: unknown; repaired: boolean } {
  const raw = record(value);
  const ids = createIdAllocator(value);
  const references = createIdReferences();
  const hasPackagingEnvelope = Array.isArray(raw.chapters) || Array.isArray(raw.sections) || Array.isArray(raw.visualUnits);
  const parsed = packagingPlanSchema.safeParse(value);
  if (parsed.success && !hasPackagingEnvelope && !ids.hasDuplicates) return { value: parsed.data, repaired: raw.schemaVersion === 1 };
  if (Object.keys(raw).length === 0) return { value, repaired: false };
  const context = buildContext(raw, request);
  const transcriptRepair = raw.transcriptRepair !== undefined ? normalizeTranscriptRepair(raw.transcriptRepair, context, ids, references) : undefined;
  const chapters = Array.isArray(raw.chapters) ? raw.chapters.map((entry, index) => normalizeChapter(entry, index, context, ids, references)) : undefined;
  const sections = Array.isArray(raw.sections) ? raw.sections.map((entry, index) => normalizeSection(entry, index, context, ids, references)) : undefined;
  const normalizedUnits = Array.isArray(raw.visualUnits) ? raw.visualUnits.map((entry) => normalizeVisualUnit(entry, context, ids, references)) : undefined;
  const units = normalizedUnits?.filter((unit) => keepVisualUnit(unit, Array.isArray(sections) ? sections.find((section) => section.id === unit.sectionId) : undefined));
  const sectionElements = (sections ?? []).flatMap((section) => Array.isArray(section.elements) ? section.elements as R[] : []);
  const rawTimeline = Array.isArray(raw.timeline) ? raw.timeline.map((entry, index) => normalizeTimelineItem(entry, index, context, {}, ids, references, 'timeline')) : [];
  const candidates = [...rawTimeline, ...sectionElements, ...(units ?? []).map((unit, index) => timelineItemFromUnit(unit, index, context, sections?.find((section) => section.id === unit.sectionId)))];
  const seenIds = new Set<string>();
  const timeline = candidates.filter((item) => {
    const itemId = stringValue(item.id);
    const unit = normalizedUnits?.find((candidate) => candidate.id === item.id);
    const section = sections?.find((candidate) => candidate.id === item.sectionId);
    const sectionIsVisual = section?.keepForVisualPackaging !== false;
    const unitIsVisual = unit ? keepVisualUnit(unit, section) : true;
    if (!itemId || !keepVisual({ ...item, visualValue: item.visualValue ?? unit?.visualValue ?? section?.visualValue }) || !sectionIsVisual || !unitIsVisual || seenIds.has(itemId)) return false;
    seenIds.add(itemId);
    return true;
  });
  const timelineIds = new Set(timeline.map((item) => item.id));
  const finalUnits = units?.filter((unit) => {
    const unitId = stringValue(unit.id);
    return unitId !== undefined && timelineIds.has(unitId);
  });
  const finalSections = sections?.map((section) => ({
    ...section,
    elementIds: Array.isArray(section.elementIds)
      ? section.elementIds
        .filter((id): id is string => typeof id === 'string')
        .map((id) => rewriteElementId(id, references))
        .filter((id, index, idsForSection): id is string => timelineIds.has(id) && idsForSection.indexOf(id) === index)
      : [],
  }));
  const canvas = record(raw.canvas);
  const style = record(raw.globalStyle);
  const constraints = record(raw.constraints);
  const insets = record(constraints.edgeInsets);
  const preferences = context.preferences;
  const rawExport = record(raw.exportHints);
  const formats = Array.isArray(rawExport.formats) ? rawExport.formats.filter((entry): entry is 'mp4' | 'webm-alpha' | 'mov-alpha' | 'png-sequence' => ['mp4', 'webm-alpha', 'mov-alpha', 'png-sequence'].includes(String(entry))) : [];
  return { repaired: true, value: {
    schemaVersion: '1.0',
    projectId: stringValue(raw.projectId) || stringValue(context.project.projectId) || 'packaging-project',
    canvas: { width: Math.max(1, Math.round(numberValue(canvas.width) ?? numberValue(context.project.canvasWidth) ?? context.width)), height: Math.max(1, Math.round(numberValue(canvas.height) ?? numberValue(context.project.canvasHeight) ?? context.height)), aspectRatio: stringValue(canvas.aspectRatio) || stringValue(context.project.aspectRatio) || (context.height > context.width ? '9:16' : '16:9'), fps: clamp(numberValue(canvas.fps) ?? numberValue(context.project.fps) ?? numberValue(context.videoMeta.fps) ?? 30, 1, 240) },
    globalStyle: { visualStyle: stringValue(style.visualStyle) || stringValue(preferences.style) || 'clean-tech', energy: clamp(numberValue(style.energy) ?? numberValue(preferences.energy) ?? 0.5, 0, 1), density: densityFor(style.density ?? preferences.density), paletteIntent: stringValue(style.paletteIntent) || 'derive-from-brand', motionIntensity: clamp(numberValue(style.motionIntensity) ?? numberValue(preferences.motionIntensity) ?? 0.5, 0, 1) },
    ...(transcriptRepair ? { transcriptRepair } : {}),
    ...(chapters ? { chapters } : {}),
    ...(finalSections ? { sections: finalSections } : {}),
    ...(finalUnits ? { visualUnits: finalUnits } : {}),
    timeline,
    constraints: { maxConcurrentOverlays: Math.max(1, Math.min(32, intClamp(numberValue(constraints.maxConcurrentOverlays) ?? numberValue(preferences.maxConcurrentOverlays) ?? 2, 1, 32))), allowBehindSubject: constraints.allowBehindSubject === true || preferences.allowBehindSubject === true, subjectAvoidPadding: clamp(numberValue(constraints.subjectAvoidPadding) ?? numberValue(preferences.subjectAvoidPadding) ?? 0.1, 0, 0.5), edgeInsets: { top: clamp(numberValue(insets.top) ?? 0.04, 0, 0.5), bottom: clamp(numberValue(insets.bottom) ?? 0.08, 0, 0.5), left: clamp(numberValue(insets.left) ?? 0.05, 0, 0.5), right: clamp(numberValue(insets.right) ?? 0.05, 0, 0.5) } },
    exportHints: { formats: formats.length > 0 ? formats : ['mp4'], transparent: rawExport.transparent === true },
  } };
}

function densityFor(value: unknown): 'low' | 'medium' | 'high' | 'auto' {
  return value === 'low' || value === 'medium' || value === 'high' ? value : 'auto';
}

export function createPackagingDirector(provider: PackagingProvider) {
  return {
    async generate(request: unknown): Promise<{ plan: PackagingPlan; aiCallCount: 1; repaired: boolean }> {
      const guard = createOneCallGuard<unknown>();
      const raw = await guard.run(() => provider({ systemPrompt: PACKAGING_DIRECTOR_SYSTEM_PROMPT, request }));
      const parsed = parseLocally(raw);
      const repaired = repairPackagingPlan(parsed.value, request);
      const plan = packagingPlanSchema.parse(repaired.value);
      return { plan, aiCallCount: 1, repaired: parsed.repaired || repaired.repaired };
    },
  };
}
