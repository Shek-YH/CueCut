import { describe, expect, it } from 'vitest';
import { resolveOverlayCollisions } from '../../src/packaging-collision/resolver';

describe('packaging collision resolver', () => {
  it('moves a colliding overlay to its next candidate without AI', () => {
    const result = resolveOverlayCollisions({
      overlays: [
        { id: 'first', rect: { x: 0.1, y: 0.1, width: 0.3, height: 0.2 }, candidates: [] , importance: 0.9 },
        { id: 'second', rect: { x: 0.1, y: 0.1, width: 0.3, height: 0.2 }, candidates: [{ x: 0.6, y: 0.1, width: 0.3, height: 0.2 }], importance: 0.5 },
      ],
      subtitleRects: [],
      subjectRects: [],
    });
    expect(result.overlays[1]?.rect.x).toBe(0.6);
    expect(result.repairs).toEqual([{ overlayId: 'second', action: 'move' }]);
    expect(result.dropped).toEqual([]);
  });

  it('does not treat sequential overlays as colliding when their time ranges do not overlap', () => {
    const result = resolveOverlayCollisions({
      overlays: [
        { id: 'first', startSec: 0, endSec: 1, rect: { x: 0.1, y: 0.1, width: 0.3, height: 0.2 }, candidates: [], importance: 0.5 },
        { id: 'second', startSec: 1, endSec: 2, rect: { x: 0.1, y: 0.1, width: 0.3, height: 0.2 }, candidates: [], importance: 0.5 },
      ],
      subtitleRects: [],
      subjectRects: [],
    });
    expect(result.overlays).toHaveLength(2);
    expect(result.overlays[1]?.rect).toEqual(result.overlays[0]?.rect);
    expect(result.repairs).toEqual([]);
  });

  it('drops a high-importance overlay when every candidate hits a fixed subject exclusion', () => {
    const result = resolveOverlayCollisions({
      overlays: [{ id: 'avoid', startSec: 1, endSec: 2, rect: { x: 0.1, y: 0.1, width: 0.3, height: 0.2 }, candidates: [{ x: 0.6, y: 0.1, width: 0.3, height: 0.2 }], importance: 0.9, subjectRelation: 'avoid' }],
      subtitleRects: [],
      subjectRects: [{ x: 0, y: 0, width: 1, height: 1 }],
    });

    expect(result.overlays).toEqual([]);
    expect(result.dropped).toEqual(['avoid']);
    expect(result.repairs).toEqual([{ overlayId: 'avoid', action: 'drop' }]);
    expect(result.warnings).toEqual(['fixed collision prevented overlay avoid from placement']);
  });
});
