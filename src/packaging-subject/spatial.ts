import type { NormalizedRect } from '../packaging-layout/safeArea';

const clamp = (value: number): number => Math.max(0, Math.min(1, value));

export function expandSubjectRect(rect: NormalizedRect, padding: number): NormalizedRect {
  const safePadding = Math.max(0, Math.min(0.5, padding));
  return {
    x: clamp(rect.x - safePadding),
    y: clamp(rect.y - safePadding),
    width: clamp(rect.width + safePadding * 2),
    height: clamp(rect.height + safePadding * 2),
  };
}

function overlaps(left: NormalizedRect, right: NormalizedRect): boolean {
  return left.x < right.x + right.width && left.x + left.width > right.x && left.y < right.y + right.height && left.y + left.height > right.y;
}

export function canPlaceRelativeToSubject(rect: NormalizedRect, relation: 'avoid' | 'foreground' | 'behind' | 'hug-left' | 'hug-right' | 'hero-center' | 'ignore', subjectZones: NormalizedRect[]): boolean {
  if (relation !== 'avoid') return true;
  return subjectZones.every((zone) => !overlaps(rect, zone));
}
