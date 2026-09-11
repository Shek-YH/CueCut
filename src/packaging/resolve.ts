import type { PackagingPlan } from '../packaging-ir/schema';
import { resolvePackagingEffect, type RegistryTemplateQuery } from '../packaging-registry/resolver';
import { solvePackagingLayout, type PackagingZone } from '../packaging-layout/solver';
import { resolveOverlayCollisions, type CollisionOverlay } from '../packaging-collision/resolver';
import { compileResolvedTimeline, type RuntimeTimelineItem } from '../packaging-timeline/compiler';

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
}

type ResolvablePackagingTimelineItem = Omit<PackagingPlan['timeline'][number], 'templateQuery'> & { templateQuery?: RegistryTemplateQuery };
type ResolvablePackagingPlan = Omit<PackagingPlan, 'timeline'> & { timeline: ResolvablePackagingTimelineItem[] };

export function resolvePackagingPlan(plan: ResolvablePackagingPlan): { overlays: ResolvedPackagingOverlay[]; runtimeTimeline: { engineVersion: string; registryVersion: string; items: RuntimeTimelineItem[] }; diagnostics: { registryFallbacks: number; layoutFallbacks: number; collisionRepairs: number; dropped: string[] } } {
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
      seed: index + 1,
      registryFallback: registry.selected !== registry.candidates[0],
      layoutFallback: layout.fallbackUsed,
    } satisfies ResolvedPackagingOverlay & { registryFallback: boolean; layoutFallback: boolean };
  });
  const collision = resolveOverlayCollisions({ overlays: initial, subtitleRects: [], subjectRects: [] });
  const runtimeTimeline = compileResolvedTimeline({ engineVersion: '1.0', registryVersion: '1.0', overlays: collision.overlays });
  return {
    overlays: collision.overlays,
    runtimeTimeline,
    diagnostics: {
      registryFallbacks: initial.filter((item) => item.registryFallback).length,
      layoutFallbacks: initial.filter((item) => item.layoutFallback).length,
      collisionRepairs: collision.repairs.length,
      dropped: collision.dropped,
    },
  };
}
