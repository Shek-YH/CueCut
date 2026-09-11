import { describe, expect, it } from 'vitest';
import { compileResolvedTimeline } from '../../src/packaging-timeline/compiler';

describe('resolved packaging timeline compiler', () => {
  it('compiles resolved registry/layout state without reading raw AI JSON', () => {
    const result = compileResolvedTimeline({
      engineVersion: '1.0',
      registryVersion: '1.0',
      overlays: [{ id: 'overlay-1', effectId: 'cuecut-stat-1', startSec: 1, endSec: 3, rect: { x: 0.1, y: 0.2, width: 0.3, height: 0.1 }, content: { value: '67%' }, motion: { entrance: 'scale_punch', emphasis: 'scale_pulse', exit: 'fade_out' }, seed: 7 }],
    });
    expect(result.items[0]?.effectId).toBe('cuecut-stat-1');
    expect(result.items[0]?.layout.x).toBe(0.1);
    expect(result.items[0]?.motion.enter.motionId).toBe('scale_punch');
  });

  it('compiles packaging metadata and cue timing without dropping it', () => {
    const result = compileResolvedTimeline({
      engineVersion: '1.0', registryVersion: '1.0', overlays: [{ id: 'overlay-1', effectId: 'cuecut-stat-1', startSec: 1, endSec: 3, rect: { x: 0.1, y: 0.2, width: 0.3, height: 0.1 }, content: { value: '67%' }, motion: { entrance: 'scale_punch', emphasis: 'scale_pulse', exit: 'fade_out' }, seed: 7, selectionReason: '核心数据', visualValue: 0.8, layer: 2, persistence: 'transient', templateQuery: { semanticRole: 'evidence', persistence: 'transient' }, cueTimesSec: [1.2], cadence: { cueOffsetsMs: [0] } }],
    });
    expect(result.items[0]).toMatchObject({ selectionReason: '核心数据', visualValue: 0.8, layer: 2, persistence: 'transient', templateQuery: { semanticRole: 'evidence', persistence: 'transient' }, cueTimesSec: [1.2], cadence: { cueOffsetsMs: [0] } });
  });
});
