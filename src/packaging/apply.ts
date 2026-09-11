import { findPackMotion } from '../motions/packCatalog';
import { projectCompositionSchema, type ProjectComposition } from '../project/schema';
import type { TranscriptSegment } from '../subtitles/srt';
import type { ResolvedPackagingOverlay } from './resolve';

function runtimeMotion(motionId: string, role: 'enter' | 'exit'): string {
  if (role === 'enter') {
    if (motionId === 'scale_punch' || motionId === 'scale_grow' || motionId === 'slam') return 'pop';
    if (motionId === 'slide_left' || motionId === 'slide_right' || motionId === 'slide_bottom' || motionId === 'slide_top') return 'soft-slide';
    return 'fade';
  }
  if (motionId === 'scale_out') return 'scale-fade-out';
  return motionId.startsWith('slide_out') ? 'fly-left' : 'fade';
}

function sourceEntry(effectId: string) {
  return findPackMotion(effectId) ?? findPackMotion(effectId.replace(/^cuecut-/, ''));
}

function isPlaceholder(value: unknown): boolean {
  return typeof value === 'string' && /^(包装重点|highlight|key point|重点)$/i.test(value.trim());
}

function readableItem(value: unknown): string | null {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  for (const key of ['text', 'label', 'headline', 'title', 'value']) {
    if (typeof record[key] === 'string' || typeof record[key] === 'number') return String(record[key]);
  }
  return null;
}

function materializeListItems(value: unknown[], overlay: ResolvedPackagingOverlay): Array<string | { text: string; cue: { startSec: number } }> {
  const offsets = overlay.cadence?.cueOffsetsMs;
  const cueTimesSec = overlay.cueTimesSec;
  const stepMs = overlay.cadence?.stepMs ?? overlay.cadence?.staggerMs;
  return value.map((item, index) => {
    const existing = item && typeof item === 'object' && !Array.isArray(item) ? item as Record<string, unknown> : null;
    const text = readableItem(item);
    if (!text) return null;
    if (existing?.cue && typeof existing.cue === 'object' && !Array.isArray(existing.cue)) return { text, cue: existing.cue as { startSec: number } };
    const offsetMs = cueTimesSec?.[index] === undefined
      ? offsets?.[index] ?? (stepMs === undefined ? undefined : index * stepMs)
      : (cueTimesSec[index]! - overlay.startSec) * 1000;
    return offsetMs === undefined ? text : { text, cue: { startSec: overlay.startSec + offsetMs / 1000 } };
  }).filter((item): item is string | { text: string; cue: { startSec: number } } => item !== null);
}

function effectContent(overlay: ResolvedPackagingOverlay, subtitles: TranscriptSegment[]): Record<string, unknown> {
  const content = { ...overlay.content };
  const transcriptText = subtitles
    .filter((subtitle) => subtitle.startSec < overlay.endSec && subtitle.endSec > overlay.startSec)
    .map((subtitle) => subtitle.text.trim())
    .filter(Boolean)
    .join(' ')
    .trim();
  const textFields = [content.text, content.headline, content.titleText, content.quoteText];
  if (transcriptText && !textFields.some((value) => typeof value === 'string' && value.trim() && !isPlaceholder(value))) {
    content.text = transcriptText;
    content.headline = transcriptText;
    if (isPlaceholder(content.label)) content.label = transcriptText;
  }
  if (Array.isArray(content.items)) {
    const items = materializeListItems(content.items, overlay);
    content.items = items.length > 0 ? items : transcriptText ? [transcriptText] : [];
  }
  const text = typeof content.text === 'string' ? content.text : undefined;
  if (text && content.headline === undefined) content.headline = text;
  if (content.value !== undefined && content.label === undefined) content.label = text ?? '';
  return content;
}

export function applyResolvedPackagingToProject(project: ProjectComposition, resolved: { overlays: ResolvedPackagingOverlay[] }): ProjectComposition {
  const next = structuredClone(project);
  next.effects = next.effects.filter((effect) => !effect.effectId.startsWith('packaging-'));
  next.segments = next.segments.filter((segment) => !segment.segmentId.startsWith('packaging-'));
  const appended = resolved.overlays.map((overlay, index) => {
    const entry = sourceEntry(overlay.effectId);
    if (!entry) throw new Error(`Packaging effect is not registered: ${overlay.effectId}`);
    const segmentId = `packaging-${overlay.id}`;
    next.segments.push({
      segmentId,
      sourceSubtitleIds: overlay.sourceSubtitleIds ?? next.subtitles.filter((subtitle) => subtitle.startSec < overlay.endSec && subtitle.endSec > overlay.startSec).map((subtitle) => subtitle.id),
      startSec: overlay.startSec,
      endSec: overlay.endSec,
      intent: 'packaging',
      importance: overlay.importance,
      chapterId: overlay.chapterId,
      sectionId: overlay.sectionId,
      selectionReason: overlay.selectionReason,
      visualValue: overlay.visualValue,
      layer: overlay.layer,
      locked: overlay.locked,
      zone: overlay.userOverride?.zone,
      persistence: overlay.persistence,
      templateQuery: overlay.templateQuery,
      cadence: overlay.cadence,
    });
    return {
      effectId: segmentId,
      segmentId,
      familyId: entry.effectFamilyId,
      variantId: entry.adapterId,
      time: { startSec: overlay.startSec, endSec: overlay.endSec },
      content: effectContent(overlay, next.subtitles),
      layout: { nx: overlay.rect.x, ny: overlay.rect.y, nw: overlay.rect.width, nh: overlay.rect.height, scale: 1, anchor: 'scene-safe', preferredSide: 'center', relationToSubject: 'avoid' },
      appearance: { accent: next.project.palette.accent, theme: 'dark' as const },
      motion: { enter: { motionId: runtimeMotion(overlay.motion.entrance, 'enter'), durationSec: Math.min(0.6, (overlay.endSec - overlay.startSec) / 3), intensity: 0.6 }, exit: { motionId: runtimeMotion(overlay.motion.exit, 'exit'), durationSec: Math.min(0.6, (overlay.endSec - overlay.startSec) / 3), intensity: 0.4 } },
      sfx: null,
      zIndex: overlay.layer === undefined ? 10 + index : 10 + overlay.layer * 10,
      userFlags: { locked: overlay.locked === true, manual: false },
      variantStateCache: {},
    } satisfies ProjectComposition['effects'][number];
  });
  next.effects.push(...appended);
  return projectCompositionSchema.parse(next);
}
