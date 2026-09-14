import { describe, expect, it } from 'vitest';
import { isNativeRenderable } from '../../src/visual-assets/nativeEligibility';
import { planVisualAssets } from '../../src/visual-assets/planner';
import { visualAssetStyles } from '../../src/visual-assets/styles';

const timeline = [
  { id: 'u-1', sourceSubtitleIds: ['s-1'], content: { assetRequest: { needed: true, assetId: 'ai_robot_assistant', displayName: 'AI Robot', kind: 'character', description: 'friendly robot assistant', semanticTags: ['ai', 'robot'], importance: 'hero' } } },
  { id: 'u-2', sourceSubtitleIds: ['s-2'], content: { assetRequest: { needed: true, assetId: 'ai_robot_assistant', displayName: 'AI Robot', kind: 'character', description: 'friendly robot assistant', semanticTags: ['robot', 'ai'], importance: 'hero' } } },
  { id: 'u-3', sourceSubtitleIds: ['s-3'], content: { assetRequest: { needed: true, assetId: 'arrow', displayName: 'Arrow', kind: 'object', description: 'simple arrow pointing right', semanticTags: ['arrow'], importance: 'normal' } } },
];

describe('visual asset planner', () => {
  it('rejects native-renderable concepts and accepts raster-worthy robots', () => {
    expect(isNativeRenderable({ kind: 'object', description: 'simple arrow pointing right', semanticTags: ['arrow'] })).toBe(true);
    expect(isNativeRenderable({ kind: 'number', description: '92%', semanticTags: ['percentage'] })).toBe(true);
    expect(isNativeRenderable({ kind: 'character', description: 'friendly robot assistant', semanticTags: ['robot'] })).toBe(false);
  });

  it('deduplicates by stable assetId, retains source subtitles, and applies a deterministic budget', () => {
    const input = { timeline, visualUnits: [] } as never;
    const first = planVisualAssets(input, { styleId: 'tech_neon_3d', maxAssets: 12 });
    const second = planVisualAssets(input, { styleId: 'tech_neon_3d', maxAssets: 12 });

    expect(first).toEqual(second);
    expect(first).toHaveLength(1);
    expect(first[0]).toMatchObject({ assetId: 'ai_robot_assistant', sourceSubtitleIds: ['s-1', 's-2'], visualUnitIds: ['u-1', 'u-2'], styleId: 'tech_neon_3d' });
  });

  it('exposes the six PRD styles without network/provider work', () => {
    expect(Object.keys(visualAssetStyles)).toEqual(['tech_neon_3d', 'clean_flat', 'glass_ui', 'clay_3d', 'editorial_paper', 'minimal_line']);
  });
});
