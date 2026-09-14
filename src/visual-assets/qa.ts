import type { AtlasPagePlan } from './atlasPlanner';
import type { AtlasSplitIssue, SplitAsset } from './splitter';

export interface AtlasQaResult {
  passed: boolean;
  issues: AtlasSplitIssue[];
}

export function validateAtlasPage(page: AtlasPagePlan, slices: SplitAsset[], issues: AtlasSplitIssue[] = []): AtlasQaResult {
  const known = new Set(slices.map((slice) => slice.assetId));
  const missing = page.slots.filter((slot) => !known.has(slot.assetId)).map((slot) => ({ code: 'empty-assigned-cell' as const, assetId: slot.assetId, message: 'Assigned slot is missing from split output' }));
  const tooSmall = slices.filter((slice) => slice.bbox.width < 2 || slice.bbox.height < 2).map((slice) => ({ code: 'subject-touching-edge' as const, assetId: slice.assetId, message: 'Subject bbox is below the minimum QA size' }));
  const allIssues = [...issues, ...missing, ...tooSmall];
  return { passed: allIssues.length === 0, issues: allIssues };
}
