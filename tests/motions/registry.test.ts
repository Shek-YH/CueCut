import { describe, expect, it } from 'vitest';
import { isMotionCompatible, motionRegistry } from '../../src/motions/registry';

describe('Motion Registry', () => {
  it('contains decoupled enter and exit presets', () => {
    expect(motionRegistry.some((motion) => motion.motionId === 'spring-in' && motion.role === 'enter')).toBe(true);
    expect(motionRegistry.some((motion) => motion.motionId === 'scale-fade-out' && motion.role === 'exit')).toBe(true);
    expect(isMotionCompatible('numeric', 'spring-in')).toBe(true);
    expect(isMotionCompatible('numeric', 'invented-motion')).toBe(false);
  });
});

