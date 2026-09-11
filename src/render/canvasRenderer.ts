import type { ProjectComposition } from '../project/schema';
import { evaluateSceneAtTime, type SceneDiagnostic, type SceneItem } from './scene';
import { defaultSubtitleSettings } from '../project/schema';
import { sceneItemBox, textLayoutPlanForSceneItem, type TextLayoutOptions, type TextLayoutRegion } from './textFit';
import { visualSurfaceForKind } from './visualSurface';
import type { Renderer } from './types';

function clipToRect(target: CanvasRenderingContext2D, region: Pick<TextLayoutRegion, 'x' | 'y' | 'width' | 'height'>): void {
  if (typeof target.beginPath !== 'function' || typeof target.rect !== 'function' || typeof target.clip !== 'function') return;
  target.beginPath();
  target.rect(region.x, region.y, region.width, region.height);
  target.clip();
}

function drawTextRegion(target: CanvasRenderingContext2D, region: TextLayoutRegion, color: string, effectId: string, diagnostics: SceneDiagnostic[]): void {
  target.save();
  clipToRect(target, region);
  target.fillStyle = color;
  target.font = `${region.weight} ${region.fontSize}px sans-serif`;
  target.textAlign = region.align;
  const canvasWithSpacing = target as CanvasRenderingContext2D & { letterSpacing?: string };
  if ('letterSpacing' in canvasWithSpacing) canvasWithSpacing.letterSpacing = `${region.letterSpacing}px`;
  const x = region.align === 'center' ? region.x + region.width / 2 : region.x;
  const firstBaseline = region.y + Math.max(region.fontSize, (region.height - region.lines.length * region.lineHeight) / 2 + region.fontSize);
  region.lines.forEach((line, index) => target.fillText(line, x, firstBaseline + index * region.lineHeight));
  target.restore();
  if (region.overflow) diagnostics.push({ effectId, code: 'text-overflow', message: 'Text exceeds its fitted region; full text was retained and clipped to the region.' });
}

function clipToItemBox(target: CanvasRenderingContext2D, width: number, height: number): void {
  if (typeof target.beginPath !== 'function' || typeof target.rect !== 'function' || typeof target.clip !== 'function') return;
  target.beginPath();
  target.rect(0, 0, width, height);
  target.clip();
}

export function canvasTextLayoutForItem(item: SceneItem, width: number, height: number, options?: TextLayoutOptions) {
  return textLayoutPlanForSceneItem(item, width, height, options);
}

export function createCanvasRenderer(project: ProjectComposition, options: { background?: string } = {}): Renderer {
  const evaluate = (timeSec: number) => evaluateSceneAtTime(project, timeSec);

  const subtitleSettings = project.subtitleSettings ?? defaultSubtitleSettings;
  const layoutOptionsForItem = (item: SceneItem): TextLayoutOptions | undefined => item.variantId === 'subtitle'
    ? { fontSize: subtitleSettings.fontSize, maxLines: 3, letterSpacing: subtitleSettings.letterSpacing, lineHeightMultiplier: subtitleSettings.lineHeight }
    : undefined;

  const renderItem = (target: CanvasRenderingContext2D, item: SceneItem, diagnostics: SceneDiagnostic[]) => {
    const box = sceneItemBox(item, target.canvas.width, target.canvas.height);
    const { width, height } = box;
    const textRegions = canvasTextLayoutForItem(item, width, height, layoutOptionsForItem(item)).regions;
    target.save();
    target.globalAlpha = item.opacity;
    target.filter = item.blur > 0 ? `blur(${item.blur}px)` : 'none';
    target.translate(box.x, box.y);
    target.rotate(item.rotation * Math.PI / 180);
    target.scale(item.scale, item.scale);
    clipToItemBox(target, width, height);
    const textColor = item.appearance.theme === 'dark' ? '#FFFFFF' : '#10141C';
    const surface = visualSurfaceForKind(item.visualKind, item.appearance.accent);
    const itemAlpha = Math.min(1, Math.max(0, item.opacity));
    target.globalAlpha = itemAlpha * surface.backgroundAlpha;
    target.fillStyle = surface.background;
    if (item.visualKind === 'chart') {
      target.fillRect(0, 0, width, height);
      target.globalAlpha = itemAlpha * surface.accentAlpha;
      target.fillStyle = surface.accent;
      [0.28, 0.52, 0.4, 0.76, 0.62].forEach((bar, index) => target.fillRect(10 + index * (width / 6), height * (1 - bar), Math.max(4, width / 12), height * bar));
      target.globalAlpha = itemAlpha * surface.contentAlpha;
      drawTextRegion(target, textRegions[0]!, textColor, item.effectId, diagnostics);
    } else if (item.visualKind === 'metric') {
      target.fillRect(0, 0, width, height);
      target.globalAlpha = itemAlpha * surface.accentAlpha;
      target.strokeStyle = item.appearance.accent;
      target.strokeRect(8, 8, Math.max(12, Math.min(width, height) - 16), Math.max(12, Math.min(width, height) - 16));
      target.globalAlpha = itemAlpha * surface.contentAlpha;
      textRegions.forEach((region) => drawTextRegion(target, region, textColor, item.effectId, diagnostics));
    } else if (item.visualKind === 'list') {
      target.fillRect(0, 0, width, height);
      target.globalAlpha = itemAlpha * surface.accentAlpha;
      target.fillStyle = surface.accent;
      target.fillRect(0, 0, Math.max(5, width * 0.025), height);
      target.globalAlpha = itemAlpha * surface.contentAlpha;
      drawTextRegion(target, textRegions[0]!, textColor, item.effectId, diagnostics);
    } else if (item.visualKind === 'quote') {
      target.fillRect(0, 0, width, height);
      target.globalAlpha = itemAlpha * surface.accentAlpha;
      target.fillStyle = surface.accent;
      target.fillRect(0, 0, Math.max(6, width * 0.03), height);
      target.globalAlpha = itemAlpha * surface.contentAlpha;
      drawTextRegion(target, textRegions[0]!, textColor, item.effectId, diagnostics);
    } else if (item.visualKind === 'highlight') {
      target.fillRect(0, 0, width, height);
      target.globalAlpha = itemAlpha * surface.accentAlpha;
      target.strokeStyle = item.appearance.accent;
      target.strokeRect(2, 2, Math.max(4, width - 4), Math.max(4, height - 4));
      target.fillStyle = surface.accent;
      target.fillRect(width * 0.1, height * 0.8, width * 0.8, Math.max(3, height * 0.05));
      target.globalAlpha = itemAlpha * surface.contentAlpha;
      drawTextRegion(target, textRegions[0]!, textColor, item.effectId, diagnostics);
    } else if (item.visualKind === 'badge') {
      target.fillRect(0, 0, width, height);
      target.globalAlpha = itemAlpha * surface.accentAlpha;
      target.fillStyle = surface.accent;
      target.fillRect(width * 0.08, height * 0.2, Math.min(width * 0.22, height * 0.5), Math.min(height * 0.3, width * 0.22));
      target.globalAlpha = itemAlpha * surface.contentAlpha;
      drawTextRegion(target, textRegions[0]!, textColor, item.effectId, diagnostics);
    } else {
      target.fillRect(0, 0, width, height);
      target.globalAlpha = itemAlpha * surface.accentAlpha;
      target.strokeStyle = item.appearance.accent;
      target.strokeRect(0, 0, width, height);
      target.globalAlpha = itemAlpha * surface.contentAlpha;
      drawTextRegion(target, textRegions[0]!, textColor, item.effectId, diagnostics);
    }
    target.restore();
  };

  return {
    evaluate,
    renderFrame(timeSec, target) {
      const frame = evaluate(timeSec);
      const diagnostics: SceneDiagnostic[] = [];
      target.fillStyle = options.background ?? project.project.palette.background;
      target.fillRect(0, 0, target.canvas.width, target.canvas.height);
      [...frame.items].sort((left, right) => left.zIndex - right.zIndex).filter((item) => item.visible).forEach((item) => renderItem(target, item, diagnostics));
      return { ...frame, diagnostics };
    },
  };
}
