export interface VisualAssetStyle {
  id: string;
  displayName: string;
  promptPrefix: string;
  material: string;
  lighting: string;
  palette: string;
  outline: string;
  depth: string;
  prohibitedTraits: string[];
}

export const visualAssetStyles: Record<string, VisualAssetStyle> = {
  tech_neon_3d: { id: 'tech_neon_3d', displayName: 'Tech Neon 3D', promptPrefix: 'clean futuristic neon 3D render', material: 'polished soft plastic', lighting: 'controlled rim light', palette: 'cyan violet on transparent', outline: 'subtle', depth: 'volumetric', prohibitedTraits: ['text', 'logo', 'watermark'] },
  clean_flat: { id: 'clean_flat', displayName: 'Clean Flat', promptPrefix: 'clean flat editorial illustration', material: 'flat vector-like shapes', lighting: 'even', palette: 'limited high-contrast colors', outline: 'crisp', depth: 'minimal', prohibitedTraits: ['text', 'logo', 'watermark'] },
  glass_ui: { id: 'glass_ui', displayName: 'Glass UI', promptPrefix: 'translucent glass UI object', material: 'frosted glass', lighting: 'soft studio', palette: 'cool translucent tones', outline: 'thin', depth: 'layered', prohibitedTraits: ['text', 'logo', 'watermark'] },
  clay_3d: { id: 'clay_3d', displayName: 'Clay 3D', promptPrefix: 'friendly clay 3D object', material: 'matte clay', lighting: 'softbox', palette: 'warm pastel', outline: 'none', depth: 'rounded', prohibitedTraits: ['text', 'logo', 'watermark'] },
  editorial_paper: { id: 'editorial_paper', displayName: 'Editorial Paper', promptPrefix: 'editorial paper collage illustration', material: 'paper cutout', lighting: 'soft daylight', palette: 'ink and muted accent', outline: 'hand-cut edge', depth: 'layered paper', prohibitedTraits: ['text', 'logo', 'watermark'] },
  minimal_line: { id: 'minimal_line', displayName: 'Minimal Line', promptPrefix: 'minimal line illustration', material: 'single-weight ink line', lighting: 'none', palette: 'black with one accent', outline: 'precise', depth: 'flat', prohibitedTraits: ['text', 'logo', 'watermark'] },
};
