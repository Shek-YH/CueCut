import { describe, expect, it } from 'vitest';
import { createEffectCapability, validateEffectContent } from '../../src/director/capabilities';

describe('Director effect capabilities', () => {
  it('preserves registry capability fields in the compact candidate contract', () => {
    const candidate = createEffectCapability({
      familyId: 'numeric',
      variantId: 'ring-a',
      displayName: '指标环 A',
      semanticTags: ['number', 'ratio'],
      visualTags: ['Number'],
      contentSlots: ['label', 'value', 'maximum'],
      minDurationSec: 0.8,
      maxDurationSec: 8,
      supportedAspectRatios: ['16:9', '9:16'],
      recommendedMotionCategories: ['spring'],
      recommendedSfxIntents: ['data'],
      useCases: ['percentage'],
      avoidCases: ['non-numeric content'],
      timingCapabilities: ['duration'],
      layoutCapabilities: ['normalized-position'],
    });

    expect(candidate).toMatchObject({
      familyId: 'numeric',
      variantId: 'ring-a',
      displayName: '指标环 A',
      contentSlots: ['label', 'value', 'maximum'],
      minDurationSec: 0.8,
      maxDurationSec: 8,
      supportedAspectRatios: ['16:9', '9:16'],
      dataContract: { kind: 'numeric', numericSlots: ['value', 'maximum'] },
    });
  });

  it('rejects non-numeric text for a numeric capability', () => {
    const candidate = createEffectCapability({
      familyId: 'numeric',
      variantId: 'ring-a',
      displayName: '指标环 A',
      semanticTags: ['number'],
      contentSlots: ['label', 'value'],
      minDurationSec: 0.8,
      maxDurationSec: 8,
      supportedAspectRatios: ['16:9'],
      recommendedMotionCategories: [],
      recommendedSfxIntents: [],
    });

    expect(validateEffectContent(candidate, { label: '盲区定位', value: '盲区定位' })).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'numeric_value_required' }),
      expect.objectContaining({ code: 'provenance_required' }),
    ]));
  });
});
