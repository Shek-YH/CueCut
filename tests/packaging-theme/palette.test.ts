import { describe, expect, it } from 'vitest';
import { packMotionCatalog, findPackMotion, type PackMotionCatalogEntry } from '../../src/motions/packCatalog';
import { defaultThemePalette, type ThemePalette } from '../../src/project/schema';
import {
  semanticSlotFor,
  semanticSlotsFor,
  resolveSemanticAccent,
  type SemanticSlot,
  type SemanticAccentInput,
} from '../../src/packaging-theme/palette';

const ALL_SLOTS: readonly SemanticSlot[] = ['warning', 'opportunity', 'result', 'method'];

/** 用真实 catalog 形态构造映射输入（与模块契约一致） */
function inputFromEntry(entry: PackMotionCatalogEntry): SemanticAccentInput {
  return {
    familyId: entry.effectFamilyId,
    visualTags: entry.visualTags,
    semanticTags: entry.semanticTags,
  };
}

describe('优先级确定性', () => {
  it('同一输入多次调用结果完全一致', () => {
    const input: SemanticAccentInput = { familyId: 'ProsCons', semanticTags: ['cons', 'flow'] };
    const a = semanticSlotFor(input);
    const b = semanticSlotFor(input);
    const c = semanticSlotFor(input);
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  it('同时命中 warning 与 method 时取 warning（优先级 warning>...>method）', () => {
    const input: SemanticAccentInput = { familyId: 'ProsCons', semanticTags: ['cons', 'flow'] };
    const slots = semanticSlotsFor(input);
    expect(slots).toContain('warning');
    expect(slots).toContain('method');
    expect(semanticSlotFor(input)).toBe('warning');
  });

  it('同时命中 opportunity 与 result 时取 opportunity', () => {
    const input: SemanticAccentInput = { semanticTags: ['save', 'metric'] };
    const slots = semanticSlotsFor(input);
    expect(slots).toContain('opportunity');
    expect(slots).toContain('result');
    expect(semanticSlotFor(input)).toBe('opportunity');
  });
});

describe('无命中兜底', () => {
  it('空对象返回 method', () => {
    expect(semanticSlotFor({})).toBe('method');
  });

  it('无关字符串返回 method', () => {
    expect(semanticSlotFor({ semanticRole: 'unknown-thing' })).toBe('method');
    expect(semanticSlotFor({ contentHint: '完全中性的旁白内容' })).toBe('method');
  });
});

describe('大小写 / 连写健壮性', () => {
  it('BeforeAfter 系列不同写法落到同一槽位', () => {
    const variants = ['BeforeAfter', 'beforeafter', 'BEFORE_AFTER', 'pack-0-2-beforeafter'];
    const slots = variants.map((v) => semanticSlotFor({ familyId: v }));
    expect(new Set(slots).size).toBe(1);
    expect(slots[0]).toBe('method');
  });

  it('真实 adapterId 形态（pack:cuecut-...）与 effectFamilyId 形态一致', () => {
    const adapterForm = semanticSlotFor({ familyId: 'pack:cuecut-before-after-split' });
    const familyForm = semanticSlotFor({ familyId: 'pack-0-2-beforeafter' });
    expect(adapterForm).toBe(familyForm);

    const attentionAdapter = semanticSlotFor({ familyId: 'pack:cuecut-attention-burst' });
    expect(attentionAdapter).toBe('warning');
  });
});

describe('palette 缺失与槽位缺值退化', () => {
  it('palette 为 undefined 时返回 fallback', () => {
    expect(resolveSemanticAccent({ semanticRole: 'x' }, undefined, '#123456')).toBe('#123456');
  });

  it('palette 存在时返回对应槽位色', () => {
    const palette: ThemePalette = {
      opportunity: '#22C55E',
      method: '#3B82F6',
      warning: '#EF4444',
      result: '#F59E0B',
    };
    expect(resolveSemanticAccent({ semanticTags: ['alert'] }, palette, '#000000')).toBe('#EF4444');
    expect(resolveSemanticAccent({ semanticTags: ['metric'] }, palette, '#000000')).toBe('#F59E0B');
  });

  it('palette 某槽位缺值时不抛错、退化到默认色（确定返回值）', () => {
    // 故意构造一个缺 method 槽位的 palette
    const partial = { opportunity: '#22C55E', warning: '#EF4444', result: '#F59E0B' } as unknown as ThemePalette;
    const got = resolveSemanticAccent({ semanticTags: ['flow', 'step'] }, partial, '#ABCDEF');
    expect(typeof got).toBe('string');
    expect(got).toMatch(/^#/);
    // 缺值槽位应退化到 defaultThemePalette 的同名槽位，而不是抛错或返回 fallback 以外的值
    expect(got).toBe(defaultThemePalette.method);
  });
});

describe('中文输入不误判', () => {
  it('中文 contentHint 不抛错且结果确定', () => {
    const a = semanticSlotFor({ contentHint: '这个方案能省钱' });
    const b = semanticSlotFor({ contentHint: '这个方案能省钱' });
    expect(a).toBe(b);
    expect(ALL_SLOTS).toContain(a);
  });

  it('中文 semanticTags 不抛错', () => {
    const slot = semanticSlotFor({ semanticTags: ['金句'] });
    expect(ALL_SLOTS).toContain(slot);
    expect(() => semanticSlotsFor({ semanticTags: ['金句', '省钱'] })).not.toThrow();
  });
});

describe('真实 catalog 压测（packCatalog.json, 87 条）', () => {
  it('每条都能映射且不抛错、结果均为四个合法槽位之一', () => {
    expect(packMotionCatalog).toHaveLength(87);
    for (const entry of packMotionCatalog) {
      const slot = semanticSlotFor(inputFromEntry(entry));
      expect(() => semanticSlotsFor(inputFromEntry(entry))).not.toThrow();
      expect(ALL_SLOTS, `entry ${entry.id} 应映射到合法槽位`).toContain(slot);
    }
  });

  it('warning/result/method 三槽位在 catalog 层均有条目（opportunity 归零属预期）', () => {
    const buckets: Record<SemanticSlot, string[]> = { warning: [], opportunity: [], result: [], method: [] };
    for (const entry of packMotionCatalog) {
      buckets[semanticSlotFor(inputFromEntry(entry))].push(entry.id);
    }
    for (const slot of ['warning', 'result', 'method'] as SemanticSlot[]) {
      expect(buckets[slot], `槽位 ${slot} 不应为空`).not.toHaveLength(0);
    }
    // opportunity 的绿色入口是 L1 的 hook；纯 catalog 关键词层机会类归零是三层改造的预期结果
    expect(buckets.opportunity, 'catalog 层 opportunity 应归零（由 L1 hook 提供）').toHaveLength(0);

    // 报告：槽位分布统计（catalog 条目无 semanticRole/evidenceType，故 L1/L2 命中率=0%，三层入口来自运行时）
    console.log('[palette] catalog 压测（L1/L2 命中率=0%，role/evidence 来自运行时而非 catalog）：');
    for (const slot of ALL_SLOTS) {
      console.log(`  ${slot}: ${buckets[slot].length} 条 -> ${buckets[slot].slice(0, 6).join(', ')}${buckets[slot].length > 6 ? ' ...' : ''}`);
    }
  });

  it('同语义族应当同色（warning / result / method 各组）', () => {
    const byId = (id: string) => findPackMotion(id)!;
    const warningGroup = ['cuecut-alert-card', 'cuecut-pros-cons', 'cuecut-attention-burst'];
    const warningSlots = warningGroup.map((id) => semanticSlotFor(inputFromEntry(byId(id))));
    expect(new Set(warningSlots)).toEqual(new Set(['warning']));

    const resultGroup = ['cuecut-gauge-metric', 'cuecut-progress-metric', 'cuecut-ranking-bars', 'cuecut-ring-metric', 'cuecut-delta-metric'];
    const resultSlots = resultGroup.map((id) => semanticSlotFor(inputFromEntry(byId(id))));
    expect(new Set(resultSlots)).toEqual(new Set(['result']));

    const methodGroup = ['cuecut-flow-steps', 'cuecut-step-timeline', 'cuecut-process-timeline', 'cuecut-checklist'];
    const methodSlots = methodGroup.map((id) => semanticSlotFor(inputFromEntry(byId(id))));
    expect(new Set(methodSlots)).toEqual(new Set(['method']));
  });

  it('修正后的误判回归：贪婪子串不再污染其他槽位', () => {
    // 'con' 不再误匹配 'icon'（icon-pop）
    expect(semanticSlotFor(inputFromEntry(findPackMotion('cuecut-icon-pop')!))).toBe('method');
    // 'bad' 不再误匹配 'badge'（三类 badge 卡片）
    for (const id of ['cuecut-badge-pulse', 'cuecut-reaction-badge', 'cuecut-ai-processing-badge']) {
      expect(semanticSlotFor(inputFromEntry(findPackMotion(id)!))).toBe('method');
    }
    // 'win' 不再误匹配 'window'（窗口演示类）
    for (const id of ['cuecut-app-window', 'cuecut-browser-window', 'cuecut-desktop-window']) {
      expect(semanticSlotFor(inputFromEntry(findPackMotion(id)!))).toBe('method');
    }
    // attention-burst 现正确落入 warning
    expect(semanticSlotFor(inputFromEntry(findPackMotion('cuecut-attention-burst')!))).toBe('warning');
  });
});

describe('三层裁决：上层压过下层', () => {
  it('L1 conclusion 压过 L3 的 cons→warning', () => {
    expect(semanticSlotFor({ semanticRole: 'conclusion', familyId: 'ProsCons', semanticTags: ['cons'] })).toBe('result');
  });

  it('L2 number 压过 L3 的 alert→warning', () => {
    expect(semanticSlotFor({ evidenceType: 'number', semanticTags: ['alert'] })).toBe('result');
  });

  it('四槽位均可达：hook/opportunity、pain-point/warning、evidence/result、definition/method', () => {
    expect(semanticSlotFor({ semanticRole: 'hook' })).toBe('opportunity');
    expect(semanticSlotFor({ semanticRole: 'pain-point' })).toBe('warning');
    expect(semanticSlotFor({ semanticRole: 'evidence' })).toBe('result');
    expect(semanticSlotFor({ semanticRole: 'definition' })).toBe('method');
  });
});

describe('端到端：语义色链路可用', () => {
  it('不同槽位的 accent 解析为不同颜色且不抛错', () => {
    const palette: ThemePalette = { ...defaultThemePalette };
    const effects = [
      { id: 'e-warn', input: { semanticTags: ['alert'] } as SemanticAccentInput },
      { id: 'e-opp', input: { semanticRole: 'hook' } as SemanticAccentInput },
      { id: 'e-res', input: { semanticTags: ['metric'] } as SemanticAccentInput },
      { id: 'e-met', input: { semanticTags: ['flow'] } as SemanticAccentInput },
    ];
    const colors = effects.map((e) => resolveSemanticAccent(e.input, palette, '#000000'));
    expect(colors.every((c) => typeof c === 'string' && c.startsWith('#'))).toBe(true);
    // warning 与 method 应解析为不同颜色
    expect(colors[0]).not.toBe(colors[3]);
  });
});
