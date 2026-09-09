import { describe, expect, it } from 'vitest';
import { blockedZonesForVisualContext, createUnavailableVisualContext } from '../../src/layout/visualContext';

describe('visual context availability', () => {
  it('represents absent person analysis explicitly without fabricating zones', () => {
    const context = createUnavailableVisualContext({
      subtitleReservedZone: { nx: 0.05, ny: 0.78, nw: 0.9, nh: 0.17 },
      safeMargins: 0.05,
    });

    expect(context.subjectZones).toEqual([]);
    expect(context.faceZones).toEqual([]);
    expect(context.subjectZonesStatus).toBe('unavailable');
    expect(context.faceZonesStatus).toBe('unavailable');
    expect(blockedZonesForVisualContext(context)).toEqual([
      { nx: 0.05, ny: 0.78, nw: 0.9, nh: 0.17 },
    ]);
  });
});
