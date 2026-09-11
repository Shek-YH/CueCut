/// <reference types="node" />
import { evaluateSceneAtTime, type SceneFrame, type SceneItem } from '../render/scene';
import { sceneItemBox, textLayoutPlanForSceneItem, type TextLayoutOptions, type TextLayoutRegion } from '../render/textFit';
import { visualSurfaceForKind } from '../render/visualSurface';
import { defaultSubtitleSettings, type ProjectComposition, type SubtitleSettings } from '../project/schema';

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
  // Export intentionally keeps deterministic glyphSeed: this backend has no external font dependency; layout, spacing, and clipping remain shared with the editor.
  let seed = 17;
  for (const code of character) seed = (seed * 31 + code.charCodeAt(0)) >>> 0;
  return seed;
}

export function exportTextLayoutForItem(item: SceneItem, width: number, height: number, options?: TextLayoutOptions) {
  return textLayoutPlanForSceneItem(item, width, height, options);
}

function drawGlyphs(buffer: Buffer, canvasWidth: number, canvasHeight: number, region: TextLayoutRegion, x: number, y: number, scale: number, alpha: number): void {
  const renderWidth = region.width * scale;
  const renderHeight = region.height * scale;
  const lineHeight = region.lineHeight * scale;
  const letterSpacing = region.letterSpacing * scale;
  const lineCells = region.lines.map((line) => Math.max(1, Math.floor(Math.min(region.fontSize * scale / 7, (renderWidth - Math.max(0, line.length - 1) * letterSpacing) / Math.max(1, line.length * 6)))));
  const contentHeight = region.lines.length * lineHeight;
  const startY = y + region.y * scale + Math.max(0, (renderHeight - contentHeight) / 2);
  region.lines.forEach((line, lineIndex) => {
    const lineY = startY + lineIndex * lineHeight;
    if (lineY >= y + (region.y + region.height) * scale || lineY + region.fontSize * scale <= y + region.y * scale) return;
    const cell = lineCells[lineIndex]!;
    const lineWidth = line.length * cell * 6 + Math.max(0, line.length - 1) * letterSpacing;
    const startX = x + region.x * scale + (region.align === 'center' ? Math.max(0, (renderWidth - lineWidth) / 2) : 0);
    [...line].forEach((character, charIndex) => {
      const seed = glyphSeed(character);
      for (let glyphY = 0; glyphY < 7; glyphY += 1) {
        for (let glyphX = 0; glyphX < 5; glyphX += 1) {
          const bit = (seed >>> ((glyphY * 5 + glyphX) % 24)) & 1;
          if (bit || glyphY === 0 || glyphY === 6) drawRectClipped(buffer, canvasWidth, canvasHeight, startX + charIndex * (cell * 6 + letterSpacing) + glyphX * cell, lineY + glyphY * cell, cell, cell, x + region.x * scale, y + region.y * scale, renderWidth, renderHeight, [255, 255, 255, Math.round(Math.min(1, alpha) * 255)]);
        }
      }
    });
  });
}

function drawSubtitleGlyphs(buffer: Buffer, width: number, height: number, item: SceneItem, settings: SubtitleSettings, opacity: number, projectCanvasWidth: number): void {
  const scale = width / Math.max(1, projectCanvasWidth);
  const regionX = width * 0.05;
  const regionY = ({ top: 0.08, center: 0.42, bottom: 0.78 }[settings.position]) * height;
  const regionWidth = width * 0.9;
  const regionHeight = height * 0.17;
  const region = exportTextLayoutForItem(item, regionWidth, regionHeight, { fontSize: settings.fontSize * scale, maxLines: 3, letterSpacing: settings.letterSpacing * scale, lineHeightMultiplier: settings.lineHeight }).regions[0]!;
  const lineHeight = region.lineHeight;
  const contentHeight = region.lines.length * lineHeight;
  const startY = regionY + Math.max(0, (regionHeight - contentHeight) / 2);
  const fill = [...colorFromHex(settings.color), Math.round(Math.min(1, opacity) * 255)] as [number, number, number, number];
  const stroke = [...colorFromHex(settings.strokeColor), Math.round(Math.min(1, opacity) * 255)] as [number, number, number, number];
  const strokeWidth = settings.strokeWidth * scale;
  const letterSpacing = region.letterSpacing;

  region.lines.forEach((line, lineIndex) => {
    const cell = Math.max(1, Math.floor(Math.min(region.fontSize / 7, (regionWidth - Math.max(0, line.length - 1) * letterSpacing) / Math.max(1, line.length * 6))));
    const lineWidth = line.length * cell * 6 + Math.max(0, line.length - 1) * letterSpacing;
    const startX = regionX + Math.max(0, (regionWidth - lineWidth) / 2);
    const lineY = startY + lineIndex * lineHeight;
    [...line].forEach((character, charIndex) => {
      const seed = glyphSeed(character);
      for (let glyphY = 0; glyphY < 7; glyphY += 1) {
        for (let glyphX = 0; glyphX < 5; glyphX += 1) {
          const bit = (seed >>> ((glyphY * 5 + glyphX) % 24)) & 1;
          if (!bit && glyphY !== 0 && glyphY !== 6) continue;
          const x = startX + charIndex * (cell * 6 + letterSpacing) + glyphX * cell;
          const y = lineY + glyphY * cell;
          if (strokeWidth > 0) drawRectClipped(buffer, width, height, x - strokeWidth, y - strokeWidth, cell + strokeWidth * 2, cell + strokeWidth * 2, regionX, regionY, regionWidth, regionHeight, stroke);
          drawRectClipped(buffer, width, height, x, y, cell, cell, regionX, regionY, regionWidth, regionHeight, fill);
        }
      }
    });
  });
}

export function renderSceneFrameToRgba(frame: SceneFrame, width: number, height: number, subtitleSettings: SubtitleSettings = defaultSubtitleSettings, projectCanvasWidth = width): Buffer {
  const buffer = Buffer.alloc(width * height * 4);
  [...frame.items].sort((left, right) => left.zIndex - right.zIndex).filter((item) => item.variantId !== 'subtitle' && item.visible && item.opacity > 0).forEach((item) => {
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
    exportTextLayoutForItem(item, box.width, box.height).regions.forEach((region) => drawGlyphs(buffer, width, height, region, x, y, scale, contentAlpha));
  });
  if (subtitleSettings.visible) {
    [...frame.items].filter((item) => item.variantId === 'subtitle' && item.visible && item.opacity > 0).forEach((item) => {
      drawSubtitleGlyphs(buffer, width, height, item, subtitleSettings, item.opacity, projectCanvasWidth);
    });
  }
  return buffer;
}

export function renderProjectFrame(project: ProjectComposition, timeSec: number): Buffer {
  return renderSceneFrameToRgba(evaluateSceneAtTime(project, timeSec), project.project.canvasWidth, project.project.canvasHeight, project.subtitleSettings ?? defaultSubtitleSettings, project.project.canvasWidth);
}

export function frameCount(project: ProjectComposition): number {
  return Math.max(1, Math.ceil(project.project.durationSec * project.project.fps));
}
