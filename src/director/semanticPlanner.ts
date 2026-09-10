import type { DirectorSemanticPlan, SemanticIntent, TranscriptInput, VisualUnit, VisualUnitItem } from './types';

const orderedMarker = /(?:第\s*([一二三四五六七八九十百\d]+)\s*步?|步骤\s*([一二三四五六七八九十百\d]+))\s*(?:啊|呀|呢)?\s*(?:[,，、:：.．。！!？?]|\s|$)/;
const chineseNumbers: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10, 百: 100 };

export function planVisualUnits(transcript: TranscriptInput[]): DirectorSemanticPlan {
  const orderedMarkers = transcript
    .map((segment, index) => ({ segment, order: readOrder(segment.text), index }))
    .filter((entry): entry is { segment: TranscriptInput; order: number; index: number } => entry.order !== null);

  const orderedByNumber = new Map<number, Array<{ segment: TranscriptInput; order: number; index: number }>>();
  for (const entry of orderedMarkers) orderedByNumber.set(entry.order, [...(orderedByNumber.get(entry.order) ?? []), entry]);
  const ordered = [...orderedByNumber.entries()]
    .map(([order, entries]) => ({ order, entries, representative: [...entries].sort((left, right) => orderedContent(right.segment.text).length - orderedContent(left.segment.text).length || left.index - right.index)[0]! }))
    .sort((left, right) => left.order - right.order || left.representative.index - right.representative.index);

  const units: VisualUnit[] = [];
  const orderedSourceSegments = ordered.length >= 2
    ? transcript.slice(ordered[0]!.entries.reduce((min, entry) => Math.min(min, entry.index), ordered[0]!.entries[0]!.index), ordered[ordered.length - 1]!.entries.reduce((max, entry) => Math.max(max, entry.index), ordered[ordered.length - 1]!.entries[0]!.index) + 1)
    : [];
  if (ordered.length >= 2) units.push(createOrderedProcessUnit(ordered, orderedSourceSegments));

  const orderedIds = new Set(orderedSourceSegments.map((segment) => segment.id));
  transcript.forEach((segment, index) => {
    if (orderedIds.has(segment.id)) return;
    units.push(createLocalUnit(segment, index));
  });

  units.sort((left, right) => left.startSec - right.startSec || left.visualUnitId.localeCompare(right.visualUnitId));
  return {
    globalThemes: transcript.map((segment) => segment.text.trim()).filter(Boolean),
    units,
    planningMode: 'seed_only',
    sourceTranscript: transcript.map((segment) => ({ ...segment })),
  };
}

function createOrderedProcessUnit(groups: Array<{ entries: Array<{ segment: TranscriptInput; order: number; index: number }>; representative: { segment: TranscriptInput; order: number; index: number } }>, sourceSegments: TranscriptInput[]): VisualUnit {
  const items: VisualUnitItem[] = groups.map((group, index) => ({
    id: `item-${group.representative.order || index + 1}`,
    text: orderedContent(group.representative.segment.text),
    startSec: Math.min(...group.entries.map((entry) => entry.segment.startSec)),
    endSec: Math.max(...group.entries.map((entry) => entry.segment.endSec)),
  }));
  return {
    visualUnitId: `vu-${groups[0]!.representative.segment.id}`,
    sourceSubtitleIds: sourceSegments.map((segment) => segment.id),
    startSec: Math.min(...groups.map((group) => group.representative.segment.startSec)),
    endSec: Math.max(...groups.map((group) => group.representative.segment.endSec)),
    semanticIntent: 'ordered_process',
    importance: 1,
    structure: { type: 'ordered_process', items },
    extractedData: { orderedItems: items.map((item) => item.text) },
  };
}

function createLocalUnit(segment: TranscriptInput, index: number): VisualUnit {
  const semanticIntent = classify(segment.text, index);
  const numbers = [...segment.text.matchAll(/[-+]?\d+(?:\.\d+)?/g)].map((match) => Number(match[0])).filter(Number.isFinite);
  const percentages = [...segment.text.matchAll(/([-+]?\d+(?:\.\d+)?)\s*[%％]/g)].map((match) => Number(match[1])).filter(Number.isFinite);
  const extractedData = numbers.length || percentages.length ? { numbers, percentages } : undefined;
  return {
    visualUnitId: `vu-${segment.id}`,
    sourceSubtitleIds: [segment.id],
    startSec: segment.startSec,
    endSec: segment.endSec,
    semanticIntent,
    importance: semanticIntent === 'hook' || semanticIntent === 'conclusion' ? 0.9 : 0.5,
    structure: semanticIntent === 'neutral' ? undefined : { type: semanticIntent },
    extractedData,
  };
}

function readOrder(text: string): number | null {
  const match = text.match(orderedMarker);
  if (!match) return null;
  const value = match[1] ?? match[2] ?? '';
  if (/^\d+$/.test(value)) return Number(value);
  if (value === '十') return 10;
  if (value.length === 2 && value.startsWith('十')) return 10 + (chineseNumbers[value[1]!] ?? 0);
  return chineseNumbers[value] ?? null;
}

function orderedContent(text: string): string {
  const match = text.match(orderedMarker);
  if (!match || match.index === undefined) return text.trim();
  const markerEnd = match.index + match[0].length;
  return text.slice(markerEnd).trim();
}

function classify(text: string, index: number): SemanticIntent {
  const trimmed = text.trim();
  if (/比较|对比|区别|不同|相比|而不是/.test(trimmed)) return 'comparison';
  if (/引用|有人说|观点|金句|认为|曾说/.test(trimmed)) return 'quote';
  if (/定义|指的是|所谓|就是/.test(trimmed)) return 'definition';
  if (/结论|总结|所以|因此|最后|记住/.test(trimmed)) return 'conclusion';
  if (/[0-9０-９%％]/.test(trimmed) || /数字|比例|指标|统计|数据|增长/.test(trimmed)) return 'evidence';
  if (/首先|其次|然后|最后|清单|包括|要点/.test(trimmed)) return 'list';
  if (index === 0 || /开头|今天|先说|核心问题/.test(trimmed)) return 'hook';
  return 'neutral';
}
