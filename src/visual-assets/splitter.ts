import type { AtlasPagePlan, AtlasSlot } from './atlasPlanner';

export interface RgbaImage {
  width: number;
  height: number;
  data: Uint8Array;
}

export interface SplitAsset {
  assetId: string;
  slot: AtlasSlot;
  square: RgbaImage;
  trimmed: RgbaImage;
  bbox: { x: number; y: number; width: number; height: number };
}

export interface AtlasSplitIssue {
  code: 'invalid-dimensions' | 'empty-assigned-cell' | 'subject-touching-edge';
  assetId?: string;
  message: string;
}

function alphaAt(image: RgbaImage, x: number, y: number): number {
  return image.data[(y * image.width + x) * 4 + 3] ?? 0;
}

function extract(image: RgbaImage, x: number, y: number, width: number, height: number): RgbaImage {
  const data = new Uint8Array(width * height * 4);
  for (let row = 0; row < height; row += 1) {
    const sourceStart = ((y + row) * image.width + x) * 4;
    data.set(image.data.subarray(sourceStart, sourceStart + width * 4), row * width * 4);
  }
  return { width, height, data };
}

function squareCrop(image: RgbaImage): RgbaImage {
  const size = Math.min(image.width, image.height);
  const x = Math.floor((image.width - size) / 2);
  const y = Math.floor((image.height - size) / 2);
  return extract(image, x, y, size, size);
}

function paddedTrim(cell: RgbaImage, bbox: { x: number; y: number; width: number; height: number }): RgbaImage {
  const padding = Math.max(1, Math.ceil(Math.max(bbox.width, bbox.height) * 0.08));
  const size = Math.min(cell.width, Math.max(bbox.width, bbox.height) + padding * 2);
  const left = Math.max(0, Math.min(cell.width - size, Math.floor(bbox.x + bbox.width / 2 - size / 2)));
  const top = Math.max(0, Math.min(cell.height - size, Math.floor(bbox.y + bbox.height / 2 - size / 2)));
  return extract(cell, left, top, size, size);
}

export function splitRgbaAtlas(image: RgbaImage, page: AtlasPagePlan): { slices: SplitAsset[]; issues: AtlasSplitIssue[] } {
  const issues: AtlasSplitIssue[] = [];
  if (image.width <= 0 || image.height <= 0 || image.data.length !== image.width * image.height * 4 || image.width % page.grid !== 0 || image.height % page.grid !== 0) {
    return { slices: [], issues: [{ code: 'invalid-dimensions', message: 'Atlas dimensions must be positive, RGBA-complete, and divisible by grid' }] };
  }
  const cellWidth = image.width / page.grid;
  const cellHeight = image.height / page.grid;
  const slices: SplitAsset[] = [];
  for (const slot of page.slots) {
    const cell = squareCrop(extract(image, slot.col * cellWidth, slot.row * cellHeight, cellWidth, cellHeight));
    let left = cell.width;
    let top = cell.height;
    let right = -1;
    let bottom = -1;
    for (let y = 0; y < cell.height; y += 1) for (let x = 0; x < cell.width; x += 1) if (alphaAt(cell, x, y) > 0) {
      left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
    }
    if (right < left || bottom < top) {
      issues.push({ code: 'empty-assigned-cell', assetId: slot.assetId, message: 'Assigned atlas cell has no alpha pixels' });
      continue;
    }
    if (left === 0 || top === 0 || right === cell.width - 1 || bottom === cell.height - 1) issues.push({ code: 'subject-touching-edge', assetId: slot.assetId, message: 'Subject touches the atlas cell edge' });
    const bbox = { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
    slices.push({ assetId: slot.assetId, slot, square: cell, trimmed: paddedTrim(cell, bbox), bbox });
  }
  return { slices, issues };
}
