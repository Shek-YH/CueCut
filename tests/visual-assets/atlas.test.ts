import { describe, expect, it } from 'vitest';
import { planAtlasPages } from '../../src/visual-assets/atlasPlanner';
import { buildAtlasPrompt } from '../../src/visual-assets/atlasPrompt';
import { splitRgbaAtlas } from '../../src/visual-assets/splitter';
import { encodeRgbaPng, splitPngAtlas } from '../../src/visual-assets/png';
import { validateAtlasPage } from '../../src/visual-assets/qa';

function paintCell(data: Uint8Array, width: number, cellSize: number, row: number, col: number): void {
  for (let y = row * cellSize + 3; y < row * cellSize + cellSize - 3; y += 1) {
    for (let x = col * cellSize + 3; x < col * cellSize + cellSize - 3; x += 1) {
      const offset = (y * width + x) * 4;
      data[offset] = 80;
      data[offset + 1] = 200;
      data[offset + 2] = 240;
      data[offset + 3] = 255;
    }
  }
}

describe('deterministic visual asset atlas pipeline', () => {
  it('freezes 5x5 for 18 assets and splits 26 assets into 25 plus 1', () => {
    const eighteen = planAtlasPages(Array.from({ length: 18 }, (_, index) => `asset_${index}`));
    const twentySix = planAtlasPages(Array.from({ length: 26 }, (_, index) => `asset_${index}`));

    expect(eighteen).toHaveLength(1);
    expect(eighteen[0]).toMatchObject({ grid: 5, assignedCellCount: 18, unusedCellCount: 7 });
    expect(eighteen[0]!.slots[0]).toMatchObject({ index: 0, row: 0, col: 0, assetId: 'asset_0' });
    expect(eighteen[0]!.slots[17]).toMatchObject({ index: 17, row: 3, col: 2, assetId: 'asset_17' });
    expect(twentySix.map((page) => page.assignedCellCount)).toEqual([25, 1]);
  });

  it('builds a strict transparent atlas prompt with gutter and frozen slot order', () => {
    const page = planAtlasPages(['robot', 'object'])[0]!;
    const prompt = buildAtlasPrompt(page, 'tech_neon_3d');

    expect(prompt).toContain('strict transparent asset atlas');
    expect(prompt).toContain('exact 2 x 2 equal square cells');
    expect(prompt).toContain('at least 15% transparent gutter');
    expect(prompt).toContain('slot 0 = robot');
    expect(prompt).toContain('unused cells fully transparent');
  });

  it('splits assigned cells deterministically and reports empty assigned cells', () => {
    const page = planAtlasPages(Array.from({ length: 16 }, (_, index) => `asset_${index}`))[0]!;
    const data = new Uint8Array(40 * 40 * 4);
    paintCell(data, 40, 10, 0, 0);
    paintCell(data, 40, 10, 1, 1);
    const result = splitRgbaAtlas({ width: 40, height: 40, data }, page);

    expect(result.slices).toHaveLength(2);
    expect(result.slices[0]).toMatchObject({ assetId: 'asset_0', square: { width: 10, height: 10 }, bbox: { x: 3, y: 3, width: 4, height: 4 } });
    expect(result.slices[0]?.trimmed.width).toBe(result.slices[0]?.trimmed.height);
    expect(result.issues.filter((issue) => issue.code === 'empty-assigned-cell')).toHaveLength(14);
    expect(validateAtlasPage(page, result.slices, result.issues).passed).toBe(false);
  });

  it('decodes synthetic PNG input and returns square and trimmed PNG bytes', () => {
    const page = planAtlasPages(['robot'])[0]!;
    const data = new Uint8Array(10 * 10 * 4);
    paintCell(data, 10, 10, 0, 0);
    const result = splitPngAtlas(encodeRgbaPng({ width: 10, height: 10, data }), page);

    expect(result.slices).toHaveLength(1);
    expect(result.slices[0]?.squarePng.slice(0, 8)).toEqual(Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect(result.slices[0]?.trimmedPng.slice(0, 8)).toEqual(Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]));
  });
});
