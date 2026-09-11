import type { PackagingPlan } from '../packaging-ir/schema';
import { resolvePackagingEffect, type RegistryTemplateQuery } from '../packaging-registry/resolver';
import { solvePackagingLayout, type PackagingZone } from '../packaging-layout/solver';
import { resolveOverlayCollisions, type CollisionOverlay, type CollisionRepair } from '../packaging-collision/resolver';
import { compileResolvedTimeline, type RuntimeTimelineItem } from '../packaging-timeline/compiler';
import type { NormalizedRect } from '../packaging-layout/safeArea';

export interface ResolvedPackagingOverlay extends CollisionOverlay {
  effectId: string;
  startSec: number;
  endSec: number;
  content: Record<string, unknown>;
  motion: PackagingPlan['timeline'][number]['motionIntent'];
  seed: number;
  rect: CollisionOverlay['rect'];
  chapterId?: string;
  sectionId?: string;
  sourceSubtitleIds?: string[];
  sequence?: number;
  semanticRole?: string;
  evidenceType?: string;
  selectionReason?: string;
  selectionScore?: number;
  visualValue?: boolean | number;
  layer?: number;
  persistence?: 'transient' | 'section' | 'chapter' | 'persistent';
  templateQuery?: Record<string, unknown>;
  cueTimesSec?: number[];
  cadence?: { stepMs?: number; staggerMs?: number; emphasisAtMs?: number; cueOffsetsMs?: number[] };
  dimAtSec?: number;
  locked?: boolean;
}

type ResolvablePackagingTimelineItem = Omit<PackagingPlan['timeline'][number], 'templateQuery'> & { templateQuery?: RegistryTemplateQuery };
type ResolvablePackagingPlan = Omit<PackagingPlan, 'timeline'> & { timeline: ResolvablePackagingTimelineItem[] };
export interface PackagingSpatialContext {
  subtitleRects?: NormalizedRect[];
  subjectRects?: NormalizedRect[];
}

const emptySpatialContext: Required<PackagingSpatialContext> = { subtitleRects: [], subjectRects: [] };

function expandRect(rect: NormalizedRect, padding: number): NormalizedRect {
  const x = Math.max(0, rect.x - padding);
  const y = Math.max(0, rect.y - padding);
  const right = Math.min(1, rect.x + rect.width + padding);
  const bottom = Math.min(1, rect.y + rect.height + padding);
  return { x, y, width: right - x, height: bottom - y };
}

function overlapsInTime(left: CollisionOverlay, right: CollisionOverlay): boolean {
  return left.startSec! < right.endSec! && left.endSec! > right.startSec!;
}

function isProtected(overlay: ResolvedPackagingOverlay): boolean {
  return overlay.locked === true || overlay.importance >= 0.8;
}

function limitConcurrentOverlays(overlays: ResolvedPackagingOverlay[], maxConcurrentOverlays: number): { overlays: ResolvedPackagingOverlay[]; dropped: string[]; repairs: CollisionRepair[]; warnings: string[] } {
  const order = new Map(overlays.map((overlay, index) => [overlay.id, index]));
  const priority = [...overlays].sort((left, right) => {
    const protectedDelta = Number(isProtected(right)) - Number(isProtected(left));
    return protectedDelta || right.importance - left.importance || order.get(left.id)! - order.get(right.id)!;
  });
  const kept: ResolvedPackagingOverlay[] = [];
  const dropped: string[] = [];
  const repairs: CollisionRepair[] = [];
  const warnings: string[] = [];
  for (const overlay of priority) {
    const concurrent = kept.filter((item) => overlapsInTime(overlay, item));
    if (concurrent.length < maxConcurrentOverlays || isProtected(overlay)) {
      kept.push(overlay);
      if (concurrent.length >= maxConcurrentOverlays) warnings.push(`maxConcurrentOverlays exceeded by protected overlay ${overlay.id}`);
      continue;
    }
    dropped.push(overlay.id);
    repairs.push({ overlayId: overlay.id, action: 'drop' });
  }
  const keptIds = new Set(kept.map((overlay) => overlay.id));
  return { overlays: overlays.filter((overlay) => keptIds.has(overlay.id)), dropped, repairs, warnings };
}

export function resolvePackagingPlan(plan: ResolvablePackagingPlan, spatialContext: PackagingSpatialContext = emptySpatialContext): { overlays: ResolvedPackagingOverlay[]; runtimeTimeline: { engineVersion: string; registryVersion: string; items: RuntimeTimelineItem[] }; diagnostics: { registryFallbacks: number; layoutFallbacks: number; collisionRepairs: number; dropped: string[]; repairs?: CollisionRepair[]; warnings?: string[] } } {
  const spatial = { ...emptySpatialContext, ...spatialContext };
  const usedEffectIds: string[] = [];
  const initial = plan.timeline.map((item, index) => {
    const registry = resolvePackagingEffect({ category: item.category, visualStyle: item.visualIntent.style, energy: item.visualIntent.energy, subjectRelation: item.placementIntent.subjectRelation, preferredZones: item.placementIntent.preferredZones, aspectRatio: plan.canvas.aspectRatio, durationSec: item.endSec - item.startSec, requiredContentSlots: Object.keys(item.content), templateQuery: item.templateQuery, excludeEffectIds: usedEffectIds });
    if (!registry.selected) throw new Error(`No packaging effect candidate for ${item.id}`);
    usedEffectIds.push(registry.selected.effect.id);
    // Layout blocking is resolved below with actual time ranges. A global rect
    // blacklist would make two non-overlapping cards fight for different zones
    // even though they never coexist on screen.
    const layout = solvePackagingLayout({ preferredZones: item.placementIntent.preferredZones as PackagingZone[], width: 0.36, height: 0.12, edgeInsets: plan.constraints.edgeInsets, blockedRects: [] });
    return {
      id: item.id,
      effectId: registry.selected.effect.id,
      rect: layout.rect,
      candidates: layout.candidates,
      importance: item.importance,
      startSec: item.startSec,
      endSec: item.endSec,
      content: item.content,
      motion: item.motionIntent,
      subjectRelation: item.placementIntent.subjectRelation,
      chapterId: item.chapterId,
      sectionId: item.sectionId,
      sourceSubtitleIds: item.sourceSubtitleIds,
      sequence: item.sequence,
      semanticRole: item.semanticRole,
      evidenceType: item.evidenceType,
      selectionReason: item.selectionReason,
      selectionScore: registry.selected.score,
      visualValue: item.visualValue,
      layer: item.layer,
      persistence: item.persistence,
      templateQuery: item.templateQuery,
      cueTimesSec: item.cueTimesSec,
      cadence: item.cadence,
      dimAtSec: item.dimAtSec,
      locked: item.userOverride?.locked,
      seed: index + 1,
      registryFallback: registry.selected !== registry.candidates[0],
      layoutFallback: layout.fallbackUsed,
    } satisfies ResolvedPackagingOverlay & { registryFallback: boolean; layoutFallback: boolean };
  });
  const collision = resolveOverlayCollisions({ overlays: initial, subtitleRects: spatial.subtitleRects, subjectRects: spatial.subjectRects.map((rect) => expandRect(rect, plan.constraints.subjectAvoidPadding)), allowSubjectOverlap: (overlay) => plan.constraints.allowBehindSubject && overlay.subjectRelation === 'behind' });
  const concurrency = limitConcurrentOverlays(collision.overlays, plan.constraints.maxConcurrentOverlays);
  const runtimeTimeline = compileResolvedTimeline({ engineVersion: '1.0', registryVersion: '1.0', overlays: concurrency.overlays });
  const repairs = [...collision.repairs, ...concurrency.repairs];
  const dropped = [...new Set([...collision.dropped, ...concurrency.dropped])];
  return {
    overlays: concurrency.overlays,
    runtimeTimeline,
    diagnostics: {
      registryFallbacks: initial.filter((item) => item.registryFallback).length,
      layoutFallbacks: initial.filter((item) => item.layoutFallback).length,
      collisionRepairs: collision.repairs.length,
      dropped,
      repairs,
      warnings: [...collision.warnings, ...concurrency.warnings],
    },
  };
}
