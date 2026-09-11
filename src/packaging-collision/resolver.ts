import type { NormalizedRect } from '../packaging-layout/safeArea';

export interface CollisionOverlay {
  id: string;
  rect: NormalizedRect;
  candidates: NormalizedRect[];
  importance: number;
  startSec?: number;
  endSec?: number;
  subjectRelation?: string;
}

export interface CollisionRepair {
  overlayId: string;
  action: 'move' | 'drop';
}

export interface CollisionResolution<T extends CollisionOverlay = CollisionOverlay> {
  overlays: T[];
  repairs: CollisionRepair[];
  dropped: string[];
  warnings: string[];
}

function overlaps(left: NormalizedRect, right: NormalizedRect): boolean {
  return left.x < right.x + right.width && left.x + left.width > right.x && left.y < right.y + right.height && left.y + left.height > right.y;
}

function overlapsInTime(left: CollisionOverlay, right: CollisionOverlay): boolean {
  if (!Number.isFinite(left.startSec) || !Number.isFinite(left.endSec) || !Number.isFinite(right.startSec) || !Number.isFinite(right.endSec)) return true;
  return left.startSec! < right.endSec! && left.endSec! > right.startSec!;
}

export function resolveOverlayCollisions<T extends CollisionOverlay>(input: { overlays: T[]; subtitleRects: NormalizedRect[]; subjectRects: NormalizedRect[]; allowSubjectOverlap?: (overlay: T) => boolean }): CollisionResolution<T> {
  const resolved: T[] = [];
  const repairs: CollisionRepair[] = [];
  const dropped: string[] = [];
  const warnings: string[] = [];
  for (const overlay of input.overlays) {
    const fixed = [...input.subtitleRects, ...(input.allowSubjectOverlap?.(overlay) ? [] : input.subjectRects)];
    const candidates = [overlay.rect, ...overlay.candidates];
    const hasFixedSafeCandidate = candidates.some((candidate) => fixed.every((other) => !overlaps(candidate, other)));
    const blocked = [...fixed, ...resolved.filter((item) => overlapsInTime(overlay, item)).map((item) => item.rect)];
    const next = candidates.find((candidate) => blocked.every((other) => !overlaps(candidate, other)));
    if (next) {
      if (next !== overlay.rect) repairs.push({ overlayId: overlay.id, action: 'move' });
      resolved.push({ ...overlay, rect: next });
      continue;
    }
    if (!hasFixedSafeCandidate) {
      dropped.push(overlay.id);
      repairs.push({ overlayId: overlay.id, action: 'drop' });
      warnings.push(`fixed collision prevented overlay ${overlay.id} from placement`);
      continue;
    }
    if (overlay.importance < 0.8) {
      dropped.push(overlay.id);
      repairs.push({ overlayId: overlay.id, action: 'drop' });
      continue;
    }
    resolved.push(overlay);
  }
  return { overlays: resolved, repairs, dropped, warnings };
}
