/// <reference types="node" />
import { evaluateSceneAtTime, type SceneFrame } from '../render/scene';
import { fitText, sceneItemBox, textRegionsForSceneItem, type TextRegion } from '../render/textFit';
import type { ProjectComposition } from '../project/schema';

function colorFromHex(value: string): [number, number, number] {
  const match = value.match(/^#([0-9a-f]{6})$/i);
  if (!match) return [255, 255, 255];
  return [Number.parseInt(match[1].slice(0, 2), 16), Number.parseInt(match[1].slice(2, 4), 16), Number.parseInt(match[1].slice(4, 6), 16)];
}

function drawRect(buffer: Buffer, canvasWidth: number, canvasHeight: number, x: number, y: number, width: number, height: number, color: [number, number, number, number]): void {
  const left = Math.max(0, Math.min(canvasWidth, Math.floor(x)));
  const top = Math.max(0, Math.min(canvasHeight, Math.floor(y)));
  const right = Math.max(left, Math.min(canvasWidth, Math.ceil(x + width)));
  const bottom = Math.max(top, Math.min(canvasHeight, Math.ceil(y + height)));
  if (right <= left || bottom <= top) return;
  const pixel = Buffer.from(color);
  for (let row = top; row < bottom; row += 1) buffer.fill(pixel, (row * canvasWidth + left) * 4, (row * canvasWidth + right) * 4);
}

function glyphSeed(character: string): number {
  let seed = 17;
  for (const code of character) seed = (seed * 31 + code.charCodeAt(0)) >>> 0;
  return seed;
}

function drawGlyphs(buffer: Buffer, canvasWidth: number, canvasHeight: number, region: TextRegion, x: number, y: number, scale: number): void {
  const fitted = fitText({ text: region.text, maxWidth: region.width, maxHeight: region.height, fontSize: region.fontSize, maxLines: region.maxLines });
  const renderWidth = region.width * scale;
  const renderHeight = region.height * scale;
  const lineHeight = fitted.lineHeight * scale;
  const lineCells = fitted.lines.map((line) => Math.max(1, Math.floor(Math.min(fitted.fontSize * scale / 7, renderWidth / Math.max(1, line.length * 6)))));
  const contentHeight = fitted.lines.length * lineHeight;
  const startY = y + region.y * scale + Math.max(0, (renderHeight - contentHeight) / 2);
  fitted.lines.forEach((line, lineIndex) => {
    const lineY = startY + lineIndex * lineHeight;
    if (lineY >= y + (region.y + region.height) * scale || lineY + fitted.fontSize * scale <= y + region.y * scale) return;
    const cell = lineCells[lineIndex]!;
    const lineWidth = line.length * cell * 6;
    const startX = x + region.x * scale + (region.align === 'center' ? Math.max(0, (renderWidth - lineWidth) / 2) : 0);
    [...line].forEach((character, charIndex) => {
      const seed = glyphSeed(character);
      for (let glyphY = 0; glyphY < 7; glyphY += 1) {
        for (let glyphX = 0; glyphX < 5; glyphX += 1) {
          const bit = (seed >>> ((glyphY * 5 + glyphX) % 24)) & 1;
          if (bit || glyphY === 0 || glyphY === 6) drawRect(buffer, canvasWidth, canvasHeight, startX + charIndex * cell * 6 + glyphX * cell, lineY + glyphY * cell, cell, cell, [255, 255, 255, 230]);
        }
      }
    });
  });
}

export function renderSceneFrameToRgba(frame: SceneFrame, width: number, height: number): Buffer {
  const buffer = Buffer.alloc(width * height * 4);
  [...frame.items].sort((left, right) => left.zIndex - right.zIndex).filter((item) => item.visible && item.opacity > 0).forEach((item) => {
    const [red, green, blue] = colorFromHex(item.appearance.accent);
    const scale = Math.max(0.01, item.scale);
    const x = item.layout.nx * width + item.translate.x;
    const y = item.layout.ny * height + item.translate.y;
    const box = sceneItemBox(item, width, height);
    const itemWidth = box.width * scale;
    const itemHeight = box.height * scale;
    drawRect(buffer, width, height, x, y, itemWidth, itemHeight, [red, green, blue, Math.round(Math.min(1, item.opacity * 0.72) * 255)]);
    if (item.visualTags.includes('Chart')) {
      [0.28, 0.52, 0.4, 0.76, 0.62].forEach((bar, index) => drawRect(buffer, width, height, x + 10 + index * (itemWidth / 6), y + itemHeight * (1 - bar), Math.max(4, itemWidth / 12), itemHeight * bar, [255, 255, 255, 220]));
    }
    if (item.visualTags.includes('Badge') || item.visualTags.includes('Icon')) drawRect(buffer, width, height, x + itemWidth * 0.08, y + itemHeight * 0.08, Math.min(itemWidth * 0.28, itemHeight * 0.42), Math.min(itemHeight * 0.28, itemWidth * 0.42), [255, 255, 255, 220]);
    if (item.visualTags.includes('Pointer') || item.visualTags.includes('Highlight')) drawRect(buffer, width, height, x + itemWidth * 0.12, y + itemHeight * 0.78, itemWidth * 0.76, Math.max(3, itemHeight * 0.05), [255, 255, 255, 220]);
    textRegionsForSceneItem(item, box.width, box.height).forEach((region) => drawGlyphs(buffer, width, height, region, x, y, scale));
  });
  return buffer;
}

export function renderProjectFrame(project: ProjectComposition, timeSec: number): Buffer {
  return renderSceneFrameToRgba(evaluateSceneAtTime(project, timeSec), project.project.canvasWidth, project.project.canvasHeight);
}

export function frameCount(project: ProjectComposition): number {
  return Math.max(1, Math.ceil(project.project.durationSec * project.project.fps));
}
