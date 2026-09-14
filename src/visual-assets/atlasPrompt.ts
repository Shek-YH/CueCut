import type { AtlasPagePlan } from './atlasPlanner';
import { visualAssetStyles } from './styles';

export function buildAtlasPrompt(page: AtlasPagePlan, styleId: string): string {
  const style = visualAssetStyles[styleId] ?? visualAssetStyles.tech_neon_3d!;
  const slots = page.slots.map((slot) => `slot ${slot.index} = ${slot.assetId}`).join('; ');
  return [
    'strict transparent asset atlas',
    `exact ${page.grid} x ${page.grid} equal square cells`,
    'one independent subject per assigned cell',
    'transparent background with real alpha',
    'at least 15% transparent gutter on all four sides of every subject',
    'no visible grid lines; no text; no numbers; no watermark; no logo; no frame labels',
    'no cross-cell shadows; no cross-cell glow; no cross-cell particles; no smoke/trails crossing cell boundaries',
    `consistent rendering language: ${style.promptPrefix}; unused cells fully transparent`,
    slots,
  ].join('. ');
}
