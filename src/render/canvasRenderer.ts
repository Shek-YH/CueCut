import type { ProjectComposition } from '../project/schema';
import { evaluateSceneAtTime, type SceneItem } from './scene';
import { fitText, sceneItemBox, TEXT_OVERFLOW_DIAGNOSTIC, textRegionsForSceneItem, type TextRegion } from './textFit';
import type { Renderer } from './types';

function drawTextRegion(target: CanvasRenderingContext2D, region: TextRegion, color: string): void {
  const fitted = fitText({ text: region.text, maxWidth: region.width, maxHeight: region.height, fontSize: region.fontSize, maxLines: region.maxLines });
  target.fillStyle = color;
  target.font = `${region.weight} ${fitted.fontSize}px sans-serif`;
  target.textAlign = region.align;
  const x = region.align === 'center' ? region.x + region.width / 2 : region.x;
  const firstBaseline = region.y + Math.max(fitted.fontSize, (region.height - fitted.lines.length * fitted.lineHeight) / 2 + fitted.fontSize);
  fitted.lines.forEach((line, index) => target.fillText(line, x, firstBaseline + index * fitted.lineHeight));
  if (fitted.overflow) {
    target.fillStyle = '#FFB454';
    target.font = '700 14px sans-serif';
    target.textAlign = 'right';
    target.fillText(TEXT_OVERFLOW_DIAGNOSTIC, region.x + region.width, region.y + 16);
  }
}

function clipToItemBox(target: CanvasRenderingContext2D, width: number, height: number): void {
  if (typeof target.beginPath !== 'function' || typeof target.rect !== 'function' || typeof target.clip !== 'function') return;
  target.beginPath();
  target.rect(0, 0, width, height);
  target.clip();
}

export function createCanvasRenderer(project: ProjectComposition, options: { background?: string } = {}): Renderer {
  const evaluate = (timeSec: number) => evaluateSceneAtTime(project, timeSec);

  const renderItem = (target: CanvasRenderingContext2D, item: SceneItem) => {
    const box = sceneItemBox(item, target.canvas.width, target.canvas.height);
    const { width, height } = box;
    const textRegions = textRegionsForSceneItem(item, width, height);
    target.save();
    target.globalAlpha = item.opacity;
    target.filter = item.blur > 0 ? `blur(${item.blur}px)` : 'none';
    target.translate(box.x, box.y);
    target.translate(item.translate.x, item.translate.y);
    target.rotate(item.rotation * Math.PI / 180);
    target.scale(item.scale, item.scale);
    clipToItemBox(target, width, height);
    const textColor = item.appearance.theme === 'dark' ? '#FFFFFF' : '#10141C';
    target.fillStyle = item.appearance.accent;
    if (item.visualKind === 'chart') {
      target.globalAlpha *= 0.92;
      target.fillStyle = '#111827';
      target.fillRect(0, 0, width, height);
      target.fillStyle = item.appearance.accent;
      [0.28, 0.52, 0.4, 0.76, 0.62].forEach((bar, index) => target.fillRect(10 + index * (width / 6), height * (1 - bar), Math.max(4, width / 12), height * bar));
      drawTextRegion(target, textRegions[0]!, textColor);
    } else if (item.visualKind === 'metric') {
      target.fillRect(0, 0, width, height);
      target.strokeStyle = item.appearance.accent;
      target.strokeRect(8, 8, Math.max(12, Math.min(width, height) - 16), Math.max(12, Math.min(width, height) - 16));
      textRegions.forEach((region) => drawTextRegion(target, region, textColor));
    } else if (item.visualKind === 'list') {
      target.fillStyle = '#171B26';
      target.fillRect(0, 0, width, height);
      target.fillStyle = item.appearance.accent;
      target.fillRect(0, 0, Math.max(5, width * 0.025), height);
      drawTextRegion(target, textRegions[0]!, textColor);
    } else if (item.visualKind === 'quote') {
      target.fillStyle = '#282341';
      target.fillRect(0, 0, width, height);
      target.fillStyle = item.appearance.accent;
      target.fillRect(0, 0, Math.max(6, width * 0.03), height);
      drawTextRegion(target, textRegions[0]!, textColor);
    } else if (item.visualKind === 'highlight') {
      target.fillStyle = '#101B24CC';
      target.fillRect(0, 0, width, height);
      target.strokeStyle = item.appearance.accent;
      target.strokeRect(2, 2, Math.max(4, width - 4), Math.max(4, height - 4));
      target.fillRect(width * 0.1, height * 0.8, width * 0.8, Math.max(3, height * 0.05));
      drawTextRegion(target, textRegions[0]!, textColor);
    } else if (item.visualKind === 'badge') {
      target.fillStyle = '#3B2434EE';
      target.fillRect(0, 0, width, height);
      target.fillStyle = item.appearance.accent;
      target.fillRect(width * 0.08, height * 0.2, Math.min(width * 0.22, height * 0.5), Math.min(height * 0.3, width * 0.22));
      drawTextRegion(target, textRegions[0]!, textColor);
    } else {
      target.globalAlpha *= 0.85;
      target.fillRect(0, 0, width, height);
      target.globalAlpha = item.opacity;
      target.strokeStyle = item.appearance.accent;
      target.strokeRect(0, 0, width, height);
      drawTextRegion(target, textRegions[0]!, textColor);
    }
    target.restore();
  };

  return {
    evaluate,
    renderFrame(timeSec, target) {
      const frame = evaluate(timeSec);
      target.fillStyle = options.background ?? project.project.palette.background;
      target.fillRect(0, 0, target.canvas.width, target.canvas.height);
      [...frame.items].sort((left, right) => left.zIndex - right.zIndex).filter((item) => item.visible).forEach((item) => renderItem(target, item));
      return frame;
    },
  };
}
