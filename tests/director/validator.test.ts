import { describe, expect, it } from 'vitest';
import { assertCandidateIds, sanitizeCompositionCandidateIds, validateCandidateIds } from '../../src/director/validator';
import { createFixtureProject } from '../../src/project/fixtures';

describe('Director local validation', () => {
  it('rejects generated IDs outside the provided candidate indexes', () => {
    expect(() =>
      assertCandidateIds(
        { familyId: 'numeric', variantId: 'ring-a', motionId: 'invented', sfxId: null },
        {
          effects: [{ familyId: 'numeric', variantId: 'ring-a' }],
          motions: ['spring-in'],
          sfx: ['soft-pop-03'],
        },
      ),
    ).toThrow(/motion/i);
  });

  it('returns a local fallback for an invalid candidate without another provider call', () => {
    expect(
      validateCandidateIds(
        { familyId: 'numeric', variantId: 'ring-a', motionId: 'invented', sfxId: null },
        {
          effects: [{ familyId: 'numeric', variantId: 'ring-a' }],
          motions: ['spring-in'],
          sfx: ['soft-pop-03'],
        },
      ),
    ).toEqual({ familyId: 'numeric', variantId: 'ring-a', motionId: 'spring-in', sfxId: null });
  });

  it('repairs invalid IDs locally while preserving the generated composition fields', () => {
    const composition = createFixtureProject();
    composition.effects[0]!.variantId = 'invented-variant';
    composition.effects[0]!.motion.enter.motionId = 'invented-enter';
    composition.effects[0]!.motion.exit.motionId = 'invented-exit';
    composition.effects[0]!.content.headline = '保留模型内容';
    composition.effects[0]!.sfx = { sfxId: 'invented-sfx', offsetSec: 0.06, gain: 0.7 };

    const result = sanitizeCompositionCandidateIds(composition, {
      effects: [{ familyId: 'numeric', variantId: 'ring-a' }],
      motions: ['spring-in', 'scale-fade-out'],
      sfx: ['soft-pop-03'],
    });

    expect(result.composition.effects[0]).toMatchObject({
      variantId: 'ring-a',
      content: { headline: '保留模型内容' },
      motion: { enter: { motionId: 'spring-in' }, exit: { motionId: 'spring-in' } },
      sfx: null,
    });
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
