import type { PackagingPlan } from '../packaging-ir/schema';
import { visualAssetRequestSchema, type VisualAssetRequest } from './schema';
import { isNativeRenderable } from './nativeEligibility';

export interface VisualAssetCandidate extends VisualAssetRequest {
  styleId: string;
  semanticFingerprint: string;
  sourceSubtitleIds: string[];
  visualUnitIds: string[];
  score: number;
}

type PlannerInput = Pick<PackagingPlan, 'timeline' | 'visualUnits'>;

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
}

function fingerprint(request: VisualAssetRequest, styleId: string): string {
  return [request.kind, normalize(request.description), [...request.semanticTags].map(normalize).sort().join(','), styleId].join('|');
}

function importanceScore(importance: VisualAssetRequest['importance']): number {
  return importance === 'hero' ? 3 : importance === 'normal' ? 2 : 1;
}

export function planVisualAssets(input: PlannerInput, options: { styleId: string; maxAssets?: number } = { styleId: 'tech_neon_3d' }): VisualAssetCandidate[] {
  const byAssetId = new Map<string, VisualAssetCandidate>();
  const units = [...(input.visualUnits ?? []), ...input.timeline.map((item) => ({ id: item.id, sourceSubtitleIds: item.sourceSubtitleIds ?? [], content: item.content }))];
  for (const unit of units) {
    const raw = unit.content.assetRequest;
    const parsed = visualAssetRequestSchema.safeParse(raw);
    if (!parsed.success || isNativeRenderable(parsed.data)) continue;
    const request = parsed.data;
    const existing = byAssetId.get(request.assetId);
    if (existing) {
      existing.sourceSubtitleIds = [...new Set([...existing.sourceSubtitleIds, ...unit.sourceSubtitleIds])];
      existing.visualUnitIds = [...new Set([...existing.visualUnitIds, unit.id])];
      continue;
    }
    byAssetId.set(request.assetId, { ...request, styleId: options.styleId, semanticFingerprint: fingerprint(request, options.styleId), sourceSubtitleIds: [...unit.sourceSubtitleIds], visualUnitIds: [unit.id], score: importanceScore(request.importance) });
  }
  return [...byAssetId.values()]
    .sort((left, right) => right.score - left.score || left.assetId.localeCompare(right.assetId))
    .slice(0, options.maxAssets ?? 12);
}
