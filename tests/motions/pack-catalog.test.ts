import { describe, expect, it } from 'vitest';
import { packMotionCatalog } from '../../src/motions/packCatalog';
import { evaluateMotionAtFrame, evaluateMotion } from '../../src/motions/runtime';
import { findMotionAdapter, motionRegistry } from '../../src/motions/registry';

describe('formal motion pack catalog', () => {
  it('contains every descriptor from the six remaining packs', () => {
    expect(packMotionCatalog).toHaveLength(87);
    expect(new Set(packMotionCatalog.map((entry) => entry.id)).size).toBe(packMotionCatalog.length);
    expect(packMotionCatalog.every((entry) => entry.license === 'PROJECT-LOCAL')).toBe(true);
    expect(packMotionCatalog.every((entry) => entry.supportedAspectRatios.includes('9:16') && entry.supportedAspectRatios.includes('16:9'))).toBe(true);
  });

  it('makes every pack entry registry, adapter, and runtime renderable', () => {
    for (const entry of packMotionCatalog) {
      const definition = motionRegistry.find((motion) => motion.motionId === entry.adapterId);
      expect(definition?.adapterId).toBe(entry.adapterId);
      expect(findMotionAdapter(entry.adapterId)).toBeDefined();
      expect(evaluateMotionAtFrame({ motionId: entry.adapterId, role: 'enter', frame: 15, fps: 30 })).toEqual(
        evaluateMotionAtFrame({ motionId: entry.adapterId, role: 'enter', frame: 15, fps: 30 }),
      );
    }
  });

  it('rejects unknown motion ids instead of silently returning an identity frame', () => {
    expect(() => evaluateMotion('unknown-motion', 'enter', 0.5)).toThrow(/Unknown motion/);
    expect(() => evaluateMotion('pack:cuecut-not-registered', 'enter', 0.5)).toThrow(/Unknown motion/);
  });
});
