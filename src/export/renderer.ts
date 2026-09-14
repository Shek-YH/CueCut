/// <reference types="node" />
import { createCanvas } from '@napi-rs/canvas';
type NapiCanvas = import('@napi-rs/canvas').Canvas;
import { evaluateSceneAtTime, type SceneFrame, type SceneItem } from '../render/scene';
import { sceneItemBox, textLayoutPlanForSceneItem, type TextLayoutOptions, type TextLayoutRegion } from '../render/textFit';
import { ensureFontsRegistered } from '../render/fontRegistry';
import { visualSurfaceForKind } from '../render/visualSurface';
import { defaultChapterNavSettings, defaultSubtitleSettings, type ProjectComposition, type SubtitleSettings } from '../project/schema';
import { createEffectRenderSpec } from '../render/effectRenderSpec';

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
  // 在交给 drawRect 取整前先判空：clipWidth/clipHeight 为 0 时，取整会让 right-left 产生 1px 残留缝隙
  if (right <= left || bottom <= top) return;
  drawRect(buffer, canvasWidth, canvasHeight, left, top, right - left, bottom - top, color);
}

/**
 * Minimal structural type for the 2D context of an `@napi-rs/canvas` canvas.
 * We only use the standard canvas 2D API surface, so a structural interface
 * keeps this module decoupled from the exact exported type name.
 */
interface TextLayerContext {
  save(): void;
  restore(): void;
  beginPath(): void;
  rect(x: number, y: number, w: number, h: number): void;
  clip(): void;
  clearRect(x: number, y: number, w: number, h: number): void;
  fillStyle: string;
  strokeStyle: string;
  lineWidth: number;
  font: string;
  textAlign: 'left' | 'center' | 'right' | 'start' | 'end';
  textBaseline: 'top' | 'middle' | 'alphabetic' | 'bottom' | 'hanging';
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetY: number;
  globalAlpha: number;
  fillText(text: string, x: number, y: number): void;
  strokeText(text: string, x: number, y: number): void;
  measureText(text: string): { width: number };
  getImageData(x: number, y: number, w: number, h: number): { data: Uint8ClampedArray; width: number; height: number };
}

// Lazily created, size-cached text rasterization layer. Each item paints its
// text onto this transparent canvas and we composite the result back into the
// RGBA buffer with a standard source-over blend (intersected with the card
// clip so clipProgress=0 yields zero text pixels).
let textLayerCanvas: NapiCanvas | null = null;
let textLayerCtx: TextLayerContext | null = null;
let textLayerWidth = 0;
let textLayerHeight = 0;

function getTextLayer(width: number, height: number): TextLayerContext {
  if (!textLayerCanvas || textLayerWidth !== width || textLayerHeight !== height) {
    const canvas = createCanvas(width, height);
    textLayerCanvas = canvas;
    textLayerCtx = canvas.getContext('2d') as unknown as TextLayerContext;
    textLayerWidth = width;
    textLayerHeight = height;
  }
  return textLayerCtx!;
}

/**
 * Composite the (already transparent) text layer back into the RGBA buffer using
 * straight-alpha source-over, restricted to `clipX/clipY/clipW/clipH`. Pixels
 * outside the clip are left untouched, which preserves the existing
 * "clipProgress=0 -> the card paints zero non-transparent text pixels" contract.
 */
function blendLayerToBuffer(
  buffer: Buffer,
  canvasWidth: number,
  canvasHeight: number,
  ctx: TextLayerContext,
  clipX: number,
  clipY: number,
  clipWidth: number,
  clipHeight: number,
): void {
  const x0 = Math.max(0, Math.floor(clipX));
  const y0 = Math.max(0, Math.floor(clipY));
  const x1 = Math.min(canvasWidth, Math.ceil(clipX + clipWidth));
  const y1 = Math.min(canvasHeight, Math.ceil(clipY + clipHeight));
  if (x1 <= x0 || y1 <= y0) return;
  const image = ctx.getImageData(x0, y0, x1 - x0, y1 - y0);
  const data = image.data;
  const stride = (x1 - x0) * 4;
  for (let row = 0; row < y1 - y0; row += 1) {
    const py = y0 + row;
    let di = (py * canvasWidth + x0) * 4;
    let li = row * stride;
    for (let col = 0; col < x1 - x0; col += 1, di += 4, li += 4) {
      const sa = data[li + 3]! / 255;
      if (sa <= 0) continue;
      const ba = buffer[di + 3]! / 255;
      const outA = sa + ba * (1 - sa);
      if (outA <= 0) continue;
      const invSa = sa / outA;
      const invBa = (ba * (1 - sa)) / outA;
      buffer[di] = Math.round(data[li]! * invSa + buffer[di]! * invBa);
      buffer[di + 1] = Math.round(data[li + 1]! * invSa + buffer[di + 1]! * invBa);
      buffer[di + 2] = Math.round(data[li + 2]! * invSa + buffer[di + 2]! * invBa);
      buffer[di + 3] = Math.round(outA * 255);
    }
  }
}

interface TextSpec {
  /** Absolute canvas coordinates of the text region (used for clipping + centering). */
  x: number;
  y: number;
  width: number;
  height: number;
  lines: string[];
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  weight: number;
  align: 'left' | 'center';
  color: string;
  strokeColor?: string;
  strokeWidth?: number;
  shadow: boolean;
  alpha: number;
  revealProgress?: number;
}

/**
 * Draw one text region onto the shared text layer using a real registered font,
 * then composite it into the RGBA buffer. The layer is cleared in the clip
 * rectangle first so each call is isolated from previous items/regions.
 */
function drawTextSpec(buffer: Buffer, canvasWidth: number, canvasHeight: number, spec: TextSpec, clipX: number, clipY: number, clipWidth: number, clipHeight: number): void {
  const ctx = getTextLayer(canvasWidth, canvasHeight);
  const fonts = ensureFontsRegistered();
  const family = spec.weight >= 600 ? fonts.bold : fonts.regular;

  ctx.clearRect(clipX, clipY, clipWidth, clipHeight);
  ctx.save();
  // clipProgress 裁剪（左起百分比）
  ctx.beginPath();
  ctx.rect(clipX, clipY, clipWidth, clipHeight);
  ctx.clip();
  // region 自身裁剪（overflow 时裁掉溢出部分）
  ctx.beginPath();
  ctx.rect(spec.x, spec.y, spec.width, spec.height);
  ctx.clip();

  ctx.font = `${spec.weight} ${spec.fontSize}px "${family}"`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.globalAlpha = Math.max(0, Math.min(1, spec.alpha));
  if (spec.shadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
  } else {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }

  const contentHeight = spec.lines.length * spec.lineHeight;
  const startBaselineY = spec.y + Math.max(spec.fontSize, (spec.height - contentHeight) / 2 + spec.fontSize);

  // 打字机预算（与 canvas 侧 drawTextRegion 语义一致）：跨行累计，只画预算内字符
  const totalChars = spec.lines.reduce((sum, line) => sum + [...line].length, 0);
  const budget = spec.revealProgress === undefined || spec.revealProgress >= 1
    ? totalChars
    : Math.ceil(totalChars * Math.max(0, Math.min(1, spec.revealProgress)));
  let remaining = budget;

  spec.lines.forEach((line, index) => {
    const baselineY = startBaselineY + index * spec.lineHeight;
    const chars = [...line];
    const shown = Math.max(0, Math.min(chars.length, remaining));
    remaining -= shown;
    // 实测宽度（measureText）用于居中，不再用字符网格估算
    let totalWidth = 0;
    for (let i = 0; i < shown; i += 1) totalWidth += ctx.measureText(chars[i]!).width + (i > 0 ? spec.letterSpacing : 0);
    const startX = spec.align === 'center' ? spec.x + (spec.width - totalWidth) / 2 : spec.x;
    let x = startX;
    if (spec.strokeWidth && spec.strokeWidth > 0 && spec.strokeColor) {
      ctx.strokeStyle = spec.strokeColor;
      ctx.lineWidth = spec.strokeWidth;
    }
    ctx.fillStyle = spec.color;
    for (let i = 0; i < shown; i += 1) {
      const char = chars[i]!;
      if (spec.strokeWidth && spec.strokeWidth > 0 && spec.strokeColor) ctx.strokeText(char, x, baselineY);
      ctx.fillText(char, x, baselineY);
      x += ctx.measureText(char).width + spec.letterSpacing;
    }
  });

  ctx.restore();
  blendLayerToBuffer(buffer, canvasWidth, canvasHeight, ctx, clipX, clipY, clipWidth, clipHeight);
}

export function exportTextLayoutForItem(item: SceneItem, width: number, height: number, options?: TextLayoutOptions) {
  return textLayoutPlanForSceneItem(item, width, height, options);
}

function drawSubtitleGlyphs(buffer: Buffer, width: number, height: number, item: SceneItem, settings: SubtitleSettings, opacity: number, projectCanvasWidth: number): void {
  const scale = width / Math.max(1, projectCanvasWidth);
  const regionX = width * 0.05;
  const regionY = ({ top: 0.08, center: 0.42, bottom: 0.78 }[settings.position]) * height;
  const regionWidth = width * 0.9;
  const regionHeight = height * 0.17;
  const region = exportTextLayoutForItem(item, regionWidth, regionHeight, { fontSize: settings.fontSize * scale, maxLines: 3, letterSpacing: settings.letterSpacing * scale, lineHeightMultiplier: settings.lineHeight }).regions[0]!;
  const ctx = getTextLayer(width, height);
  const fonts = ensureFontsRegistered();
  const family = region.weight >= 600 ? fonts.bold : fonts.regular;

  ctx.clearRect(regionX, regionY, regionWidth, regionHeight);
  ctx.save();
  ctx.beginPath();
  ctx.rect(regionX, regionY, regionWidth, regionHeight);
  ctx.clip();
  ctx.font = `${region.weight} ${region.fontSize}px "${family}"`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  ctx.globalAlpha = Math.min(1, Math.max(0, opacity));

  const contentHeight = region.lines.length * region.lineHeight;
  const startBaselineY = regionY + Math.max(region.fontSize, (regionHeight - contentHeight) / 2 + region.fontSize);
  region.lines.forEach((line, index) => {
    const baselineY = startBaselineY + index * region.lineHeight;
    const chars = [...line];
    let totalWidth = 0;
    for (let i = 0; i < chars.length; i += 1) totalWidth += ctx.measureText(chars[i]!).width + (i > 0 ? region.letterSpacing : 0);
    const startX = region.align === 'center' ? regionX + (regionWidth - totalWidth) / 2 : regionX;
    let x = startX;
    if (settings.strokeWidth > 0) {
      ctx.strokeStyle = settings.strokeColor;
      ctx.lineWidth = settings.strokeWidth * 2;
    }
    ctx.fillStyle = settings.color;
    for (const char of chars) {
      if (settings.strokeWidth > 0) ctx.strokeText(char, x, baselineY);
      ctx.fillText(char, x, baselineY);
      x += ctx.measureText(char).width + region.letterSpacing;
    }
  });
  ctx.restore();
  blendLayerToBuffer(buffer, width, height, ctx, regionX, regionY, regionWidth, regionHeight);
}

export function renderSceneFrameToRgba(frame: SceneFrame, width: number, height: number, subtitleSettings: SubtitleSettings = defaultSubtitleSettings, projectCanvasWidth = width, showChapterProgress = true): Buffer {
  const buffer = Buffer.alloc(width * height * 4);
  [...frame.items].sort((left, right) => left.zIndex - right.zIndex).filter((item) => item.variantId !== 'subtitle' && item.visible && item.opacity > 0).forEach((item) => {
    if (item.visualKind === 'chapterNav') {
      drawChapterNav(buffer, width, height, item, showChapterProgress);
      return;
    }
    const [red, green, blue] = colorFromHex(item.appearance.accent);
    const scale = Math.max(0.01, item.scale);
    const box = sceneItemBox(item, width, height);
    const x = box.x;
    const y = box.y;
    const itemWidth = box.width * scale;
    const itemHeight = box.height * scale;
    const renderSpec = createEffectRenderSpec(item);
    const surface = visualSurfaceForKind(item.visualKind, item.appearance.accent);
    const itemAlpha = Math.min(1, Math.max(0, item.opacity));
    const background = colorFromHex(surface.background);
    const backgroundAlpha = Math.round(itemAlpha * surface.backgroundAlpha * 255);
    const accentAlpha = Math.round(itemAlpha * surface.accentAlpha * 255);
    const contentAlpha = itemAlpha * surface.contentAlpha;
    // clipProgress：影响卡片像素的水平填充范围（左起百分比，undefined 视为 1）
    const clip = typeof item.clipProgress === 'number' ? Math.max(0, Math.min(1, item.clipProgress)) : 1;
    // glow：导出侧现在已具备 shadowBlur 能力（见下方说明），卡片本体的 glow 实现排期在文字修复之后，避免本次引入回归
    const prog = typeof item.progress === 'number' ? Math.max(0, Math.min(1, item.progress)) : 1;
    const cardClipX = x;
    const cardClipY = y;
    const cardClipW = itemWidth * clip;
    const cardClipH = itemHeight;
    drawRectClipped(buffer, width, height, x, y, itemWidth, itemHeight, cardClipX, cardClipY, cardClipW, cardClipH, [...background, backgroundAlpha]);
    if (renderSpec.visualKind === 'chart') {
      [0.28, 0.52, 0.4, 0.76, 0.62].forEach((bar, index) => drawRectClipped(buffer, width, height, x + 10 + index * (itemWidth / 6), y + itemHeight * (1 - bar * prog), Math.max(4, itemWidth / 12), itemHeight * bar * prog, cardClipX, cardClipY, cardClipW, cardClipH, [red, green, blue, accentAlpha]));
    } else if (renderSpec.visualKind === 'list') {
      drawRectClipped(buffer, width, height, x, y, Math.max(5, itemWidth * 0.025), itemHeight, cardClipX, cardClipY, cardClipW, cardClipH, [red, green, blue, accentAlpha]);
    } else if (renderSpec.visualKind === 'quote') {
      drawRectClipped(buffer, width, height, x, y, Math.max(6, itemWidth * 0.03), itemHeight, cardClipX, cardClipY, cardClipW, cardClipH, [red, green, blue, accentAlpha]);
    } else if (renderSpec.visualKind === 'metric') {
      drawRectClipped(buffer, width, height, x + itemWidth * 0.08, y + itemHeight * 0.08, Math.max(1, itemWidth * 0.84), Math.max(2, itemHeight * 0.03), cardClipX, cardClipY, cardClipW, cardClipH, [red, green, blue, accentAlpha]);
      drawRectClipped(buffer, width, height, x + itemWidth * 0.08, y + itemHeight * 0.89, Math.max(1, itemWidth * 0.84), Math.max(2, itemHeight * 0.03), cardClipX, cardClipY, cardClipW, cardClipH, [red, green, blue, accentAlpha]);
    } else if (renderSpec.visualKind === 'highlight') {
      drawRectClipped(buffer, width, height, x + itemWidth * 0.1, y + itemHeight * 0.8, itemWidth * 0.8 * prog, Math.max(3, itemHeight * 0.05), cardClipX, cardClipY, cardClipW, cardClipH, [red, green, blue, accentAlpha]);
    } else if (renderSpec.visualKind === 'badge') {
      drawRectClipped(buffer, width, height, x + itemWidth * 0.08, y + itemHeight * 0.2, Math.min(itemWidth * 0.22, itemHeight * 0.5), Math.min(itemHeight * 0.3, itemWidth * 0.22), cardClipX, cardClipY, cardClipW, cardClipH, [red, green, blue, accentAlpha]);
    } else {
      drawRectClipped(buffer, width, height, x, y, itemWidth, itemHeight, cardClipX, cardClipY, cardClipW, cardClipH, [red, green, blue, backgroundAlpha]);
    }
    exportTextLayoutForItem(item, box.width, box.height).regions.forEach((region) => drawTextSpec(buffer, width, height, {
      x: x + region.x * scale,
      y: y + region.y * scale,
      width: region.width * scale,
      height: region.height * scale,
      lines: region.lines,
      fontSize: region.fontSize * scale,
      lineHeight: region.lineHeight * scale,
      letterSpacing: region.letterSpacing * scale,
      weight: region.weight,
      align: region.align,
      color: '#FFFFFF',
      shadow: true,
      alpha: contentAlpha,
      revealProgress: item.revealProgress,
    }, cardClipX, cardClipY, cardClipW, cardClipH));
  });
  if (subtitleSettings.visible) {
    [...frame.items].filter((item) => item.variantId === 'subtitle' && item.visible && item.opacity > 0).forEach((item) => {
      drawSubtitleGlyphs(buffer, width, height, item, subtitleSettings, item.opacity, projectCanvasWidth);
    });
  }
  return buffer;
}

export function renderProjectFrame(project: ProjectComposition, timeSec: number): Buffer {
  return renderSceneFrameToRgba(evaluateSceneAtTime(project, timeSec), project.project.canvasWidth, project.project.canvasHeight, project.subtitleSettings ?? defaultSubtitleSettings, project.project.canvasWidth, project.project.chapterNav?.showProgress ?? defaultChapterNavSettings.showProgress);
}

interface GlyphClip { x: number; y: number; width: number; height: number }

function drawChapterNav(buffer: Buffer, canvasWidth: number, canvasHeight: number, item: SceneItem, showProgress: boolean): void {
  if (item.content.kind !== 'chapters') return;
  const scale = Math.max(0.01, item.scale);
  const box = sceneItemBox(item, canvasWidth, canvasHeight);
  const x = box.x;
  const y = box.y;
  const itemWidth = box.width * scale;
  const itemHeight = box.height * scale;
  // 横条底色（半透明黑），铺满 item 区域
  drawRectClipped(buffer, canvasWidth, canvasHeight, x, y, itemWidth, itemHeight, x, y, itemWidth, itemHeight, [0, 0, 0, 115]);
  // 进度线（accent 色，底部细矩形）
  if (showProgress && typeof item.chapterProgress === 'number') {
    const lineH = Math.max(2, itemHeight * 0.06);
    const [ar, ag, ab] = colorFromHex(item.appearance.accent);
    drawRectClipped(buffer, canvasWidth, canvasHeight, x, y + itemHeight - lineH, itemWidth * Math.max(0, Math.min(1, item.chapterProgress)), lineH, x, y, itemWidth, itemHeight, [ar, ag, ab, 255]);
  }
  const items = item.content.items;
  const activeIndex = item.content.activeIndex;
  const sep = ' · ';
  const fontSize = Math.max(11, itemWidth * 0.016);
  const ctx = getTextLayer(canvasWidth, canvasHeight);
  const fonts = ensureFontsRegistered();
  const itemAlpha = Math.min(1, Math.max(0, item.opacity));
  const cy = y + itemHeight / 2;
  const measure = (text: string, weight: number) => {
    ctx.font = `${weight} ${fontSize}px "${weight >= 600 ? fonts.bold : fonts.regular}"`;
    return ctx.measureText(text).width;
  };
  const sepW = measure(sep, 600);
  const parts = items.map((text, idx) => ({ text, active: idx === activeIndex, width: measure(text, idx === activeIndex ? 700 : 600) }));
  const windowWidth = (a: number, b: number) => {
    let w = 0;
    for (let i = a; i <= b; i += 1) w += parts[i]!.width;
    return w + sepW * (b - a);
  };
  let from = 0;
  let to = items.length - 1;
  // 放不下时保当前章节：优先保留前缀（含当前章节），超出则从尾部丢弃
  if (windowWidth(0, activeIndex) <= itemWidth) {
    from = 0;
    to = activeIndex;
    while (to + 1 <= items.length - 1 && windowWidth(0, to + 1) <= itemWidth) to += 1;
  } else {
    from = activeIndex;
    while (from - 1 >= 0 && windowWidth(from - 1, activeIndex) <= itemWidth) from -= 1;
    to = activeIndex;
  }
  let drawX = x + Math.max(0, (itemWidth - windowWidth(from, to)) / 2);

  ctx.clearRect(x, y, itemWidth, itemHeight);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, itemWidth, itemHeight);
  ctx.clip();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  ctx.globalAlpha = itemAlpha;
  for (let i = from; i <= to; i += 1) {
    if (i > from) {
      ctx.fillStyle = 'rgba(255,255,255,0.62)';
      ctx.font = `600 ${fontSize}px "${fonts.regular}"`;
      ctx.fillText(sep, drawX, cy);
      drawX += sepW;
    }
    const part = parts[i]!;
    ctx.font = `${part.active ? 700 : 600} ${fontSize}px "${part.active ? fonts.bold : fonts.regular}"`;
    ctx.fillStyle = part.active ? item.appearance.accent : 'rgba(255,255,255,0.62)';
    ctx.fillText(part.text, drawX, cy);
    drawX += part.width;
  }
  ctx.restore();
  blendLayerToBuffer(buffer, canvasWidth, canvasHeight, ctx, x, y, itemWidth, itemHeight);
}

export function frameCount(project: ProjectComposition): number {
  return Math.max(1, Math.ceil(project.project.durationSec * project.project.fps));
}
