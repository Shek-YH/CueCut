import { placementZones } from '../packaging-ir/schema';
import { clampToEdgeInsets, type EdgeInsets, type NormalizedRect } from './safeArea';

export type PackagingZone = (typeof placementZones)[number];

export interface LayoutSolveInput {
  preferredZones: PackagingZone[];
  width: number;
  height: number;
  edgeInsets: EdgeInsets;
  blockedRects: NormalizedRect[];
}

export interface LayoutSolveResult {
  rect: NormalizedRect;
  candidates: NormalizedRect[];
  resolvedZone: PackagingZone;
  fallbackUsed: boolean;
}

function overlaps(left: NormalizedRect, right: NormalizedRect): boolean {
  return left.x < right.x + right.width && left.x + left.width > right.x && left.y < right.y + right.height && left.y + left.height > right.y;
}

function candidateFor(zone: PackagingZone, input: LayoutSolveInput): NormalizedRect {
  const { width, height, edgeInsets } = input;
  const centerX = (1 - width) / 2;
  const centerY = (1 - height) / 2;
  const left = edgeInsets.left;
  const right = 1 - edgeInsets.right - width;
  const top = edgeInsets.top;
  const bottom = 1 - edgeInsets.bottom - height;
  const positions: Record<PackagingZone, { x: number; y: number }> = {
    'upper-left': { x: left, y: top },
    'upper-right': { x: right, y: top },
    'mid-left': { x: left, y: centerY },
    'mid-right': { x: right, y: centerY },
    center: { x: centerX, y: centerY },
    'lower-left': { x: left, y: bottom },
    'lower-right': { x: right, y: bottom },
    top: { x: centerX, y: top },
    bottom: { x: centerX, y: bottom },
  };
  return clampToEdgeInsets({ x: positions[zone].x, y: positions[zone].y, width, height }, edgeInsets);
}

export function solvePackagingLayout(input: LayoutSolveInput): LayoutSolveResult {
  const zones = [...new Set([...input.preferredZones, ...placementZones])];
  const candidates = zones.map((zone) => ({ zone, rect: candidateFor(zone, input) }));
  const available = candidates.find((candidate) => input.blockedRects.every((blocked) => !overlaps(candidate.rect, blocked)));
  const selected = available ?? candidates[0];
  if (!selected) throw new Error('At least one preferred zone is required');
  return { rect: selected.rect, candidates: candidates.slice(1).map((candidate) => candidate.rect), resolvedZone: selected.zone, fallbackUsed: selected !== candidates[0] };
}
