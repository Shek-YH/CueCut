import { compileMotionIntent, type CompiledMotion, type PackagingMotionIntent } from '../packaging-motion/compiler';
import type { NormalizedRect } from '../packaging-layout/safeArea';
import type { PackagingTemplateQuery } from '../packaging-ir/schema';

export interface ResolvedOverlayInput {
  id: string;
  effectId: string;
  startSec: number;
  endSec: number;
  rect: NormalizedRect;
  content: Record<string, unknown>;
  motion: PackagingMotionIntent;
  seed: number;
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
  templateQuery?: PackagingTemplateQuery;
  cueTimesSec?: number[];
  cadence?: { stepMs?: number; staggerMs?: number; emphasisAtMs?: number; cueOffsetsMs?: number[] };
  dimAtSec?: number;
  locked?: boolean;
  userOverride?: { locked: boolean; zone?: string };
}

export interface RuntimeTimelineItem {
  id: string;
  effectId: string;
  startSec: number;
  endSec: number;
  layout: NormalizedRect;
  content: Record<string, unknown>;
  motion: CompiledMotion;
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
  templateQuery?: PackagingTemplateQuery;
  cueTimesSec?: number[];
  cadence?: { stepMs?: number; staggerMs?: number; emphasisAtMs?: number; cueOffsetsMs?: number[] };
  dimAtSec?: number;
  locked?: boolean;
  userOverride?: { locked: boolean; zone?: string };
}

export function compileResolvedTimeline(input: { engineVersion: string; registryVersion: string; overlays: ResolvedOverlayInput[] }): { engineVersion: string; registryVersion: string; items: RuntimeTimelineItem[] } {
  return {
    engineVersion: input.engineVersion,
    registryVersion: input.registryVersion,
    items: input.overlays
      .map((overlay) => ({
        id: overlay.id,
        effectId: overlay.effectId,
        startSec: overlay.startSec,
        endSec: overlay.endSec,
        layout: { ...overlay.rect },
        content: { ...overlay.content },
        motion: compileMotionIntent(overlay.motion, { seed: overlay.seed, durationSec: overlay.endSec - overlay.startSec }),
        chapterId: overlay.chapterId,
        sectionId: overlay.sectionId,
        sourceSubtitleIds: overlay.sourceSubtitleIds,
        sequence: overlay.sequence,
        semanticRole: overlay.semanticRole,
        evidenceType: overlay.evidenceType,
        selectionReason: overlay.selectionReason,
        selectionScore: overlay.selectionScore,
        visualValue: overlay.visualValue,
        layer: overlay.layer,
        persistence: overlay.persistence,
        templateQuery: overlay.templateQuery,
        cueTimesSec: overlay.cueTimesSec,
        cadence: overlay.cadence,
        dimAtSec: overlay.dimAtSec,
        locked: overlay.locked,
        userOverride: overlay.userOverride,
      }))
      .sort((left, right) => left.startSec - right.startSec || left.id.localeCompare(right.id)),
  };
}
