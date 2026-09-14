import { defaultThemePalette, type ThemePalette } from '../project/schema';

export type SemanticSlot = keyof ThemePalette;

export interface SemanticAccentInput {
  semanticRole?: string;
  evidenceType?: string;
  familyId?: string;
  visualTags?: readonly string[];
  semanticTags?: readonly string[];
  /** 内容大类：来自 effect content / catalog useCases 的关键词，用于兜底判断 */
  contentHint?: string;
}

/**
 * 语义色优先级：警告 > 机会 > 结果 > 方法。
 * 命中多个槽位时按此顺序取第一个，保证同一份输入永远得到同一个颜色（确定性，不依赖遍历顺序）。
 */
const SLOT_PRIORITY: readonly SemanticSlot[] = ['warning', 'opportunity', 'result', 'method'];

const SLOT_KEYWORDS: Record<SemanticSlot, readonly string[]> = {
  warning: [
    'alert', 'warning', 'warn', 'risk', 'risky', 'pain', 'painpoint', 'cons',
    'pitfall', 'error', 'mistake', 'problem', 'caveat', 'trap', 'fail', 'failure',
    'cost', 'costly', 'expensive', 'downside', 'limit', 'limitation', 'tradeoff',
    'attention',
  ],
  opportunity: [
    'opportunity', 'chance', 'growth', 'grow', 'benefit', 'beneficial', 'saving', 'save',
    'advantage', 'rise', 'rising', 'gain', 'boom', 'blueocean',
    'upside', 'cheap', 'cheaper', 'fast', 'easy', 'easier',
  ],
  result: [
    'metric', 'kpi', 'chart', 'number', 'numeric', 'percentage', 'percent', 'gauge',
    'ranking', 'rank', 'data', 'stat', 'stats', 'statistic', 'roi', 'revenue', 'profit',
    'result', 'outcome', 'delta', 'progress', 'score', 'rate', 'realtime',
    'sparkline', 'stacked', 'bar', 'area', 'trend', 'plot', 'histogram', 'heatmap', 'funnel', 'waterfall',
  ],
  method: [
    'method', 'flow', 'step', 'steps', 'process', 'checklist', 'timeline', 'guide',
    'tutorial', 'howto', 'definition', 'define', 'term', 'formula', 'framework',
    'template', 'compare', 'comparison', 'versus', 'beforeafter', 'before', 'after',
    'quote', 'keypoint', 'feature', 'list', 'pros', 'structure', 'diagram',
  ],
};

/**
 * L1：语义角色直接裁决（最高优先级，命中即返回、不看下层）。
 * 单值映射到单槽位，确定性最强；未知/缺失则下探 L2。
 */
const ROLE_SLOT: Record<string, SemanticSlot> = {
  'pain-point': 'warning',
  'hook': 'opportunity',
  'evidence': 'result',
  'conclusion': 'result',
  'definition': 'method',
  'ordered-process': 'method',
  'comparison': 'method',
  'quote': 'method',
  'neutral': 'method',
};

/**
 * L2：证据类型直接裁决（role 未命中时启用）。命中即返回、不看 L3。
 */
const EVIDENCE_SLOT: Record<string, SemanticSlot> = {
  'number': 'result',
  'list': 'method',
  'process': 'method',
  'comparison': 'method',
  'screenshot': 'method',
  'quote': 'method',
  'highlight': 'method',
  'none': 'method',
};

/**
 * 把任意标识符拆成可比较的 token：
 * - `BeforeAfter` -> ['beforeafter', 'before', 'after']
 * - `pack-0-3-quote` -> ['pack', '0', '3', 'quote']
 * - `前情提要` -> ['前情提要']
 */
function tokensOf(value: string | undefined): string[] {
  if (typeof value !== 'string' || value.length === 0) return [];
  const normalized = value.toLowerCase();
  const parts = normalized.split(/[^a-z0-9\u4e00-\u9fff]+/).filter(Boolean);
  const tokens = new Set<string>(parts);
  for (const part of parts) {
    tokens.add(part.replace(/[^a-z0-9]/g, '')); // '0-3-quote' 类碎片
    // camelCase / 连写拆词：只在整体长度受限时尝试，避免产生噪音 token
    if (part.length > 24) continue;
    for (const piece of part.match(/[a-z]{3,}/g) ?? []) tokens.add(piece);
  }
  tokens.delete('');
  return [...tokens];
}

function tokenMatches(token: string, keyword: string): boolean {
  if (token === keyword) return true;
  return token.includes(keyword);
}

/** 命中关键词的槽位集合（不做优先级裁决，供调用方与测试观察） */
export function semanticSlotsFor(input: SemanticAccentInput): SemanticSlot[] {
  const tokens = [
    ...tokensOf(input.semanticRole),
    ...tokensOf(input.evidenceType),
    ...tokensOf(input.familyId),
    ...(input.visualTags ?? []).flatMap((tag) => tokensOf(tag)),
    ...(input.semanticTags ?? []).flatMap((tag) => tokensOf(tag)),
    ...tokensOf(input.contentHint),
  ];
  const matched: SemanticSlot[] = [];
  for (const slot of SLOT_PRIORITY) {
    if (SLOT_KEYWORDS[slot].some((keyword) => tokens.some((token) => tokenMatches(token, keyword)))) matched.push(slot);
  }
  return matched;
}

/**
 * 三层裁决：上层有结果就不看下层，保证确定性。
 * - L1 `semanticRole`：role→slot 直接映射（pain-point→warning / hook→opportunity / evidence,conclusion→result / 其余→method）。
 * - L2 `evidenceType`：evidence→slot 直接映射（number→result / 其余→method）。
 * - L3 catalog 关键词兜底：多槽命中按 `warning > opportunity > result > method` 取第一个；全未命中→method。
 */
export function semanticSlotFor(input: SemanticAccentInput): SemanticSlot {
  if (input.semanticRole) {
    const slot = ROLE_SLOT[input.semanticRole.toLowerCase()];
    if (slot) return slot;
  }
  if (input.evidenceType) {
    const slot = EVIDENCE_SLOT[input.evidenceType.toLowerCase()];
    if (slot) return slot;
  }
  return semanticSlotsFor(input)[0] ?? 'method';
}

/**
 * 解析最终 accent 颜色。palette 缺失（旧工程文件）时退化为 fallback，
 * 保证历史 composition 渲染结果不变。
 */
export function resolveSemanticAccent(input: SemanticAccentInput, palette: ThemePalette | undefined, fallback: string): string {
  if (!palette) return fallback;
  const slot = semanticSlotFor(input);
  return palette[slot] ?? defaultThemePalette[slot] ?? fallback;
}
