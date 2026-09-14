import { deflateSync, inflateSync } from 'node:zlib';
import type { AtlasPagePlan } from './atlasPlanner';
import { splitRgbaAtlas, type RgbaImage, type AtlasSplitIssue } from './splitter';

const PNG_SIGNATURE = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const result = new Uint8Array(12 + data.length);
  const view = new DataView(result.buffer);
  view.setUint32(0, data.length);
  result.set(new TextEncoder().encode(type), 4);
  result.set(data, 8);
  view.setUint32(8 + data.length, crc32(result.subarray(4, 8 + data.length)));
  return result;
}

export function encodeRgbaPng(image: RgbaImage): Uint8Array {
  const header = new Uint8Array(13);
  const headerView = new DataView(header.buffer);
  headerView.setUint32(0, image.width);
  headerView.setUint32(4, image.height);
  header[8] = 8;
  header[9] = 6;
  const scanlines = new Uint8Array(image.height * (image.width * 4 + 1));
  for (let row = 0; row < image.height; row += 1) {
    const offset = row * (image.width * 4 + 1);
    scanlines[offset] = 0;
    scanlines.set(image.data.subarray(row * image.width * 4, (row + 1) * image.width * 4), offset + 1);
  }
  const compressed = deflateSync(scanlines);
  const chunks = [chunk('IHDR', header), chunk('IDAT', compressed), chunk('IEND', new Uint8Array())];
  const result = new Uint8Array(PNG_SIGNATURE.length + chunks.reduce((total, item) => total + item.length, 0));
  result.set(PNG_SIGNATURE);
  let offset = PNG_SIGNATURE.length;
  for (const item of chunks) { result.set(item, offset); offset += item.length; }
  return result;
}

function paeth(left: number, above: number, upperLeft: number): number {
  const estimate = left + above - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const aboveDistance = Math.abs(estimate - above);
  const upperLeftDistance = Math.abs(estimate - upperLeft);
  return leftDistance <= aboveDistance && leftDistance <= upperLeftDistance ? left : aboveDistance <= upperLeftDistance ? above : upperLeft;
}

export function decodeRgbaPng(bytes: Uint8Array): RgbaImage {
  if (!PNG_SIGNATURE.every((byte, index) => bytes[index] === byte)) throw new Error('Invalid PNG signature');
  let offset = PNG_SIGNATURE.length;
  let width = 0;
  let height = 0;
  let idat = new Uint8Array();
  while (offset + 12 <= bytes.length) {
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset);
    const length = view.getUint32(0);
    const type = new TextDecoder().decode(bytes.subarray(offset + 4, offset + 8));
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      const header = new DataView(data.buffer, data.byteOffset, data.byteLength);
      width = header.getUint32(0); height = header.getUint32(4);
      if (data[8] !== 8 || data[9] !== 6 || data[12] !== 0) throw new Error('Only non-interlaced 8-bit RGBA PNG is supported');
    } else if (type === 'IDAT') {
      const next = new Uint8Array(idat.length + data.length); next.set(idat); next.set(data, idat.length); idat = next;
    } else if (type === 'IEND') break;
    offset += 12 + length;
  }
  if (!width || !height || !idat.length) throw new Error('PNG is missing RGBA image data');
  const filtered = new Uint8Array(inflateSync(idat));
  const rowBytes = width * 4;
  const stride = rowBytes + 1;
  if (filtered.length !== height * stride) throw new Error('PNG scanline dimensions are invalid');
  const data = new Uint8Array(width * height * 4);
  for (let row = 0; row < height; row += 1) {
    const filter = filtered[row * stride];
    const source = filtered.subarray(row * stride + 1, (row + 1) * stride);
    const target = data.subarray(row * rowBytes, (row + 1) * rowBytes);
    const previous = row > 0 ? data.subarray((row - 1) * rowBytes, row * rowBytes) : undefined;
    for (let index = 0; index < rowBytes; index += 1) {
      const left = index >= 4 ? target[index - 4]! : 0;
      const above = previous?.[index] ?? 0;
      const upperLeft = index >= 4 ? previous?.[index - 4] ?? 0 : 0;
      const value = source[index]!;
      target[index] = filter === 0 ? value : filter === 1 ? value + left : filter === 2 ? value + above : filter === 3 ? value + Math.floor((left + above) / 2) : filter === 4 ? value + paeth(left, above, upperLeft) : (() => { throw new Error(`Unsupported PNG filter: ${filter}`); })();
    }
  }
  return { width, height, data };
}

export interface SplitPngAsset {
  assetId: string;
  squarePng: Uint8Array;
  trimmedPng: Uint8Array;
  bbox: { x: number; y: number; width: number; height: number };
}

export function splitPngAtlas(bytes: Uint8Array, page: AtlasPagePlan): { slices: SplitPngAsset[]; issues: AtlasSplitIssue[] } {
  const split = splitRgbaAtlas(decodeRgbaPng(bytes), page);
  return { issues: split.issues, slices: split.slices.map((slice) => ({ assetId: slice.assetId, squarePng: encodeRgbaPng(slice.square), trimmedPng: encodeRgbaPng(slice.trimmed), bbox: slice.bbox })) };
}
