import { describe, expect, it } from 'vitest';
import { planVisualUnits } from '../../src/director/semanticPlanner';

describe('Director semantic planner', () => {
  it('groups an ordered four-step process into one traceable VisualUnit', () => {
    const result = planVisualUnits([
      { id: 's-1', startSec: 24, endSec: 32, text: '第一步，先确定目标' },
      { id: 's-2', startSec: 53, endSec: 61, text: '第二步，收集证据' },
      { id: 's-3', startSec: 116, endSec: 124, text: '第三步，比较方案' },
      { id: 's-4', startSec: 127, endSec: 135, text: '第四步，复盘结论' },
    ]);

    expect(result.units).toHaveLength(1);
    expect(result.units[0]).toMatchObject({
      visualUnitId: 'vu-s-1',
      sourceSubtitleIds: ['s-1', 's-2', 's-3', 's-4'],
      startSec: 24,
      endSec: 135,
      semanticIntent: 'ordered_process',
    });
    expect(result.units[0]?.structure?.items).toEqual([
      { id: 'item-1', text: '先确定目标', startSec: 24, endSec: 32 },
      { id: 'item-2', text: '收集证据', startSec: 53, endSec: 61 },
      { id: 'item-3', text: '比较方案', startSec: 116, endSec: 124 },
      { id: 'item-4', text: '复盘结论', startSec: 127, endSec: 135 },
    ]);
  });

  it('keeps local semantic units distinct instead of assigning one global tag set', () => {
    const result = planVisualUnits([
      { id: 'quote', startSec: 0, endSec: 2, text: '有人说，先做重要的事。' },
      { id: 'compare', startSec: 2, endSec: 5, text: 'A 和 B 的区别在于执行成本。' },
    ]);

    expect(result.units.map((unit) => unit.semanticIntent)).toEqual(['quote', 'comparison']);
    expect(result.units.map((unit) => unit.sourceSubtitleIds)).toEqual([['quote'], ['compare']]);
  });
});
