import type { AtlasPagePlan } from './atlasPlanner';
import type { VisualAssetCandidate } from './planner';

export interface VisualAssetManifest {
  schema: 'cuecut.visual-assets/1';
  styleId: string;
  atlases: AtlasPagePlan[];
  assets: Array<VisualAssetCandidate & { sourceAtlasId: string; row: number; col: number }>;
}

export function createVisualAssetManifest(styleId: string, pages: AtlasPagePlan[], candidates: VisualAssetCandidate[]): VisualAssetManifest {
  const byId = new Map(candidates.map((candidate) => [candidate.assetId, candidate]));
  const assets = pages.flatMap((page) => page.slots.flatMap((slot) => {
    const candidate = byId.get(slot.assetId);
    return candidate ? [{ ...candidate, sourceAtlasId: page.atlasId, row: slot.row, col: slot.col }] : [];
  }));
  return { schema: 'cuecut.visual-assets/1', styleId, atlases: pages, assets };
}
