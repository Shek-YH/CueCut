import { describe, expect, it } from 'vitest';
import { validateVisualGrounding, type GroundingUnit } from '../../src/director/grounding';

const subtitles = [{ id: 's-1', startSec: 0, endSec: 2, text: '准确率提升到 92%，上线后效果稳定。' }];

function unit(overrides: Partial<GroundingUnit> = {}): GroundingUnit {
  return {
    id: 'unit-1',
    sourceSubtitleIds: ['s-1'],
    keyClaim: '准确率提升到 92%',
    evidenceText: '准确率提升到 92%',
    visualValue: 0.9,
    ...overrides,
  };
}

describe('local KeyClaim/Evidence grounding', () => {
  it('accepts claims whose evidence and numeric values come from source subtitles', () => {
    const result = validateVisualGrounding([unit()], subtitles);

    expect(result.fatal).toEqual([]);
    expect(result.acceptedUnitIds).toEqual(['unit-1']);
  });

  it('blocks fabricated numbers, placeholder claims, and unknown subtitle ids', () => {
    const result = validateVisualGrounding([
      unit({ id: 'fake-number', keyClaim: '准确率提升到 99%', evidenceText: '准确率提升到 99%' }),
      unit({ id: 'placeholder', keyClaim: '包装重点', evidenceText: '包装重点' }),
      unit({ id: 'unknown-source', sourceSubtitleIds: ['missing'] }),
    ], subtitles);

    expect(result.fatal.map((issue) => issue.unitId)).toEqual(['fake-number', 'placeholder', 'unknown-source']);
    expect(result.acceptedUnitIds).toEqual([]);
  });

  it('drops low-value units and warns on adjacent duplicate claims', () => {
    const result = validateVisualGrounding([
      unit({ id: 'low', visualValue: 0.2 }),
      unit({ id: 'first' }),
      unit({ id: 'duplicate' }),
    ], subtitles);

    expect(result.droppedUnitIds).toEqual(['low']);
    expect(result.warnings.map((issue) => issue.unitId)).toEqual(['duplicate']);
    expect(result.acceptedUnitIds).toEqual(['first', 'duplicate']);
  });
});
