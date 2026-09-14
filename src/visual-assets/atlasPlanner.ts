export interface AtlasSlot {
  index: number;
  assetId: string;
  row: number;
  col: number;
}

export interface AtlasPagePlan {
  atlasId: string;
  page: number;
  grid: number;
  assignedCellCount: number;
  unusedCellCount: number;
  slots: AtlasSlot[];
}

export function planAtlasPages(assetIds: string[], maxCellsPerAtlas = 25): AtlasPagePlan[] {
  if (maxCellsPerAtlas < 1 || maxCellsPerAtlas > 25) throw new Error('maxCellsPerAtlas must be between 1 and 25');
  const pages: AtlasPagePlan[] = [];
  for (let offset = 0, page = 0; offset < assetIds.length; offset += maxCellsPerAtlas, page += 1) {
    const ids = assetIds.slice(offset, offset + maxCellsPerAtlas);
    const grid = Math.ceil(Math.sqrt(ids.length));
    const slots = ids.map((assetId, index) => ({ index, assetId, row: Math.floor(index / grid), col: index % grid }));
    pages.push({ atlasId: `atlas-${page + 1}`, page, grid, assignedCellCount: ids.length, unusedCellCount: grid * grid - ids.length, slots });
  }
  return pages;
}
