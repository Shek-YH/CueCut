/// <reference types="node" />
import { evaluateSceneAtTime, type SceneFrame } from '../render/scene';
import { fitText, sceneItemBox, textRegionsForSceneItem, type TextRegion } from '../render/textFit';
import { visualSurfaceForKind } from '../render/visualSurface';
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

function drawRectClipped(buffer: Buffer, canvasWidth: number, canvasHeight: number, x: number, y: number, width: number, height: number, clipX: number, clipY: number, clipWidth: number, clipHeight: number, color: [number, number, number, number]): void {
  const left = Math.max(x, clipX);
  const top = Math.max(y, clipY);
  const right = Math.min(x + width, clipX + clipWidth);
  const bottom = Math.min(y + height, clipY + clipHeight);
  drawRect(buffer, canvasWidth, canvasHeight, left, top, right - left, bottom - top, color);
}

function glyphSeed(character: string): number {
  let seed = 17;
  for (const code of character) seed = (seed * 31 + code.charCodeAt(0)) >>> 0;
  return seed;
}

function drawGlyphs(buffer: Buffer, canvasWidth: number, canvasHeight: number, region: TextRegion, x: number, y: number, scale: number, alpha: number): void {
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
          if (bit || glyphY === 0 || glyphY === 6) drawRectClipped(buffer, canvasWidth, canvasHeight, startX + charIndex * cell * 6 + glyphX * cell, lineY + glyphY * cell, cell, cell, x + region.x * scale, y + region.y * scale, renderWidth, renderHeight, [255, 255, 255, Math.round(Math.min(1, alpha) * 255)]);
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
    const box = sceneItemBox(item, width, height);
    const x = box.x;
    const y = box.y;
    const itemWidth = box.width * scale;
    const itemHeight = box.height * scale;
    const surface = visualSurfaceForKind(item.visualKind, item.appearance.accent);
    const itemAlpha = Math.min(1, Math.max(0, item.opacity));
    const background = colorFromHex(surface.background);
    const backgroundAlpha = Math.round(itemAlpha * surface.backgroundAlpha * 255);
    const accentAlpha = Math.round(itemAlpha * surface.accentAlpha * 255);
    const contentAlpha = itemAlpha * surface.contentAlpha;
    drawRect(buffer, width, height, x, y, itemWidth, itemHeight, [...background, backgroundAlpha]);
    if (item.visualKind === 'chart') {
      [0.28, 0.52, 0.4, 0.76, 0.62].forEach((bar, index) => drawRect(buffer, width, height, x + 10 + index * (itemWidth / 6), y + itemHeight * (1 - bar), Math.max(4, itemWidth / 12), itemHeight * bar, [red, green, blue, accentAlpha]));
    } else if (item.visualKind === 'list') {
      drawRect(buffer, width, height, x, y, Math.max(5, itemWidth * 0.025), itemHeight, [red, green, blue, accentAlpha]);
    } else if (item.visualKind === 'quote') {
      drawRect(buffer, width, height, x, y, Math.max(6, itemWidth * 0.03), itemHeight, [red, green, blue, accentAlpha]);
    } else if (item.visualKind === 'metric') {
      drawRect(buffer, width, height, x + itemWidth * 0.08, y + itemHeight * 0.08, Math.max(1, itemWidth * 0.84), Math.max(2, itemHeight * 0.03), [red, green, blue, accentAlpha]);
      drawRect(buffer, width, height, x + itemWidth * 0.08, y + itemHeight * 0.89, Math.max(1, itemWidth * 0.84), Math.max(2, itemHeight * 0.03), [red, green, blue, accentAlpha]);
    } else if (item.visualKind === 'highlight') {
      drawRect(buffer, width, height, x + itemWidth * 0.1, y + itemHeight * 0.8, itemWidth * 0.8, Math.max(3, itemHeight * 0.05), [red, green, blue, accentAlpha]);
    } else if (item.visualKind === 'badge') {
      drawRect(buffer, width, height, x + itemWidth * 0.08, y + itemHeight * 0.2, Math.min(itemWidth * 0.22, itemHeight * 0.5), Math.min(itemHeight * 0.3, itemWidth * 0.22), [red, green, blue, accentAlpha]);
    } else {
      drawRect(buffer, width, height, x, y, itemWidth, itemHeight, [red, green, blue, backgroundAlpha]);
    }
    textRegionsForSceneItem(item, box.width, box.height).forEach((region) => drawGlyphs(buffer, width, height, region, x, y, scale, contentAlpha));
  });
  return buffer;
}

export function renderProjectFrame(project: ProjectComposition, timeSec: number): Buffer {
  return renderSceneFrameToRgba(evaluateSceneAtTime(project, timeSec), project.project.canvasWidth, project.project.canvasHeight);
}

export function frameCount(project: ProjectComposition): number {
  return Math.max(1, Math.ceil(project.project.durationSec * project.project.fps));
}
