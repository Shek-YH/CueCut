import { describe, expect, it } from 'vitest';
import { compileMotionIntent } from '../../src/packaging-motion/compiler';
import { createFixtureProject } from '../../src/project/fixtures';
import { updateEffectDraftMotion } from '../../src/runtime/draft';

describe('Effect Lab draft motion edits', () => {
  it('invalidates compiled motion when a draft enter or exit motion changes', () => {
    const effect = createFixtureProject().effects[0]!;
    const withCompiled = { ...effect, motion: { ...effect.motion, compiled: compileMotionIntent({ entrance: 'fade_in', emphasis: 'none', exit: 'fade_out' }, { seed: 1, durationSec: 4 }) } };

    const updated = updateEffectDraftMotion(withCompiled, 'enter', { motionId: 'slide_right' });

    expect(updated.motion.enter.motionId).toBe('slide_right');
    expect(updated.motion.compiled).toBeUndefined();
    expect(withCompiled.motion.compiled).toBeDefined();
  });
});
