import { describe, expect, it } from 'vitest';
import { effectTemplateRegistry, findEffectTemplate } from '../../src/effects/templateRegistry';
import { transitionMotionRegistry } from '../../src/motions/transitionRegistry';
import { contentAnimationRegistry } from '../../src/motions/contentRegistry';

describe('split effect and motion registries', () => {
  it('exposes pack effects as templates with stable renderer identity', () => {
    const template = findEffectTemplate('pack-0-2-beforeafter', 'cuecut-before-after-split');

    expect(template).toBeDefined();
    expect(template?.effectTemplateId).toBe('pack-0-2-beforeafter:cuecut-before-after-split');
    expect(template?.rendererId).toBe('pack-0-2-beforeafter');
    expect(effectTemplateRegistry.some((item) => item.effectTemplateId === template?.effectTemplateId)).toBe(true);
  });

  it('keeps pack effect ids out of transition motion semantics', () => {
    expect(transitionMotionRegistry.some((motion) => motion.category === 'pack-effect')).toBe(false);
    expect(transitionMotionRegistry.some((motion) => motion.motionId === 'slide')).toBe(true);
    expect(contentAnimationRegistry.some((motion) => motion.motionId === 'animated-number')).toBe(true);
    expect(contentAnimationRegistry.every((motion) => ['text', 'number', 'list'].includes(motion.category))).toBe(true);
  });
});
