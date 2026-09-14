import { defaultChapterNavSettings, type ProjectComposition } from '../project/schema';
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

function drawTextRegion(target: CanvasRenderingContext2D, region: TextLayoutRegion, color: string, effectId: string, diagnostics: SceneDiagnostic[], revealProgress?: number): void {
  target.save();
  clipToRect(target, region);
  target.fillStyle = color;
  // 统一轻微阴影：对齐参考视频/竞品的可读性做法
  target.shadowColor = 'rgba(0,0,0,0.55)';
  target.shadowBlur = 6;
  target.shadowOffsetY = 2;
  target.font = `${region.weight} ${region.fontSize}px sans-serif`;
  target.textAlign = region.align;
  const canvasWithSpacing = target as CanvasRenderingContext2D & { letterSpacing?: string };
  if ('letterSpacing' in canvasWithSpacing) canvasWithSpacing.letterSpacing = `${region.letterSpacing}px`;
  const x = region.align === 'center' ? region.x + region.width / 2 : region.x;
  const firstBaseline = region.y + Math.max(region.fontSize, (region.height - region.lines.length * region.lineHeight) / 2 + region.fontSize);
  if (revealProgress === undefined || revealProgress >= 1) {
    // 整行原样绘制
    region.lines.forEach((line, index) => target.fillText(line, x, firstBaseline + index * region.lineHeight));
  } else {
    // 打字机：跨行累计预算，只画预算内的字符
    const total = region.lines.reduce((sum, line) => sum + [...line].length, 0);
    const budget = Math.ceil(total * Math.max(0, Math.min(1, revealProgress)));
    let remaining = budget;
    region.lines.forEach((line, index) => {
      const chars = [...line];
      const shown = Math.max(0, Math.min(chars.length, remaining));
      remaining -= shown;
      const text = chars.slice(0, shown).join('');
      if (text) target.fillText(text, x, firstBaseline + index * region.lineHeight);
    });
  }
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

  const renderItem = (target: CanvasRenderingContext2D, item: SceneItem, diagnostics: SceneDiagnostic[], timeSec: number) => {
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
    // clipProgress：在包围盒裁剪之后叠加一层"从左向右展开"的裁剪（undefined 时不加）
    if (typeof item.clipProgress === 'number') {
      const clipWidth = width * Math.max(0, Math.min(1, item.clipProgress));
      clipToRect(target, { x: 0, y: 0, width: clipWidth, height });
    }
    const textColor = item.appearance.theme === 'dark' ? '#FFFFFF' : '#10141C';
    const surface = visualSurfaceForKind(item.visualKind, item.appearance.accent);
    const itemAlpha = Math.min(1, Math.max(0, item.opacity));
    // glow：画卡片本体前设置阴影，仅作用于卡片本体（后续手动清零，避免文字被大阴影糊化）
    if (item.glow && item.glow > 0) {
      target.shadowColor = item.appearance.accent;
      target.shadowBlur = 24 * Math.max(0, Math.min(1, item.glow));
    }
    target.globalAlpha = itemAlpha * surface.backgroundAlpha;
    target.fillStyle = surface.background;
    target.shadowBlur = 0;
    const prog = typeof item.progress === 'number' ? Math.max(0, Math.min(1, item.progress)) : 1;
    if (item.visualKind === 'chart') {
      target.fillRect(0, 0, width, height);
      target.globalAlpha = itemAlpha * surface.accentAlpha;
      target.fillStyle = surface.accent;
      [0.28, 0.52, 0.4, 0.76, 0.62].forEach((bar, index) => target.fillRect(10 + index * (width / 6), height * (1 - bar * prog), Math.max(4, width / 12), height * bar * prog));
      target.globalAlpha = itemAlpha * surface.contentAlpha;
      drawTextRegion(target, textRegions[0]!, textColor, item.effectId, diagnostics, item.revealProgress);
    } else if (item.visualKind === 'metric') {
      target.fillRect(0, 0, width, height);
      target.globalAlpha = itemAlpha * surface.accentAlpha;
      target.strokeStyle = item.appearance.accent;
      target.strokeRect(8, 8, Math.max(12, Math.min(width, height) - 16), Math.max(12, Math.min(width, height) - 16));
      target.globalAlpha = itemAlpha * surface.contentAlpha;
      textRegions.forEach((region) => drawTextRegion(target, region, textColor, item.effectId, diagnostics, item.revealProgress));
    } else if (item.visualKind === 'list') {
      target.fillRect(0, 0, width, height);
      target.globalAlpha = itemAlpha * surface.accentAlpha;
      target.fillStyle = surface.accent;
      target.fillRect(0, 0, Math.max(5, width * 0.025), height);
      target.globalAlpha = itemAlpha * surface.contentAlpha;
      drawTextRegion(target, textRegions[0]!, textColor, item.effectId, diagnostics, item.revealProgress);
    } else if (item.visualKind === 'quote') {
      target.fillRect(0, 0, width, height);
      target.globalAlpha = itemAlpha * surface.accentAlpha;
      target.fillStyle = surface.accent;
      target.fillRect(0, 0, Math.max(6, width * 0.03), height);
      target.globalAlpha = itemAlpha * surface.contentAlpha;
      drawTextRegion(target, textRegions[0]!, textColor, item.effectId, diagnostics, item.revealProgress);
    } else if (item.visualKind === 'highlight') {
      target.fillRect(0, 0, width, height);
      target.globalAlpha = itemAlpha * surface.accentAlpha;
      target.strokeStyle = item.appearance.accent;
      target.strokeRect(2, 2, Math.max(4, width - 4), Math.max(4, height - 4));
      target.fillStyle = surface.accent;
      target.fillRect(width * 0.1, height * 0.8, width * 0.8 * prog, Math.max(3, height * 0.05));
      target.globalAlpha = itemAlpha * surface.contentAlpha;
      drawTextRegion(target, textRegions[0]!, textColor, item.effectId, diagnostics, item.revealProgress);
    } else if (item.visualKind === 'badge') {
      target.fillRect(0, 0, width, height);
      target.globalAlpha = itemAlpha * surface.accentAlpha;
      target.fillStyle = surface.accent;
      target.fillRect(width * 0.08, height * 0.2, Math.min(width * 0.22, height * 0.5), Math.min(height * 0.3, width * 0.22));
      target.globalAlpha = itemAlpha * surface.contentAlpha;
      drawTextRegion(target, textRegions[0]!, textColor, item.effectId, diagnostics, item.revealProgress);
    } else if (item.visualKind === 'chapterNav') {
      const navContent = item.content.kind === 'chapters' ? item.content : null;
      target.globalAlpha = itemAlpha;
      target.fillStyle = 'rgba(0,0,0,0.45)';
      target.fillRect(0, 0, width, height);
      const showProgress = (project.project.chapterNav ?? defaultChapterNavSettings).showProgress;
      if (showProgress && typeof item.chapterProgress === 'number') {
        const lineH = Math.max(2, height * 0.06);
        target.fillStyle = item.appearance.accent;
        target.fillRect(0, height - lineH, width * Math.max(0, Math.min(1, item.chapterProgress)), lineH);
      }
      if (navContent) {
        const sep = ' · ';
        const fontSize = Math.max(11, width * 0.016);
        const cy = height / 2;
        const measure = (text: string) => {
          target.font = `600 ${fontSize}px sans-serif`;
          return target.measureText(text).width;
        };
        const parts = navContent.items.map((text, idx) => ({ text, active: idx === navContent.activeIndex, width: 0 }));
        const sepW = measure(sep);
        parts.forEach((part) => { part.width = measure(part.text); });
        const windowWidth = (a: number, b: number) => {
          let w = 0;
          for (let i = a; i <= b; i += 1) w += parts[i]!.width;
          return w + sepW * (b - a);
        };
        const active = navContent.activeIndex;
        let from = 0;
        let to = parts.length - 1;
        // 放不下时保当前章节：优先保留前缀（含当前章节），超出则从尾部丢弃
        if (windowWidth(0, active) <= width) {
          from = 0;
          to = active;
          while (to + 1 <= parts.length - 1 && windowWidth(0, to + 1) <= width) to += 1;
        } else {
          from = active;
          while (from - 1 >= 0 && windowWidth(from - 1, active) <= width) from -= 1;
          to = active;
        }
        let x = (width - windowWidth(from, to)) / 2;
        target.textAlign = 'left';
        target.textBaseline = 'middle';
        // 沿用 drawTextRegion 的可读性阴影
        target.shadowColor = 'rgba(0,0,0,0.55)';
        target.shadowBlur = 6;
        target.shadowOffsetY = 2;
        for (let i = from; i <= to; i += 1) {
          if (i > from) {
            target.fillStyle = 'rgba(255,255,255,0.62)';
            target.fillText(sep, x, cy);
            x += sepW;
          }
          const part = parts[i]!;
          target.fillStyle = part.active ? item.appearance.accent : 'rgba(255,255,255,0.62)';
          target.font = `${part.active ? 700 : 600} ${fontSize}px sans-serif`;
          target.fillText(part.text, x, cy);
          x += part.width;
        }
        target.shadowBlur = 0;
      }
    } else {
      target.fillRect(0, 0, width, height);
      target.globalAlpha = itemAlpha * surface.accentAlpha;
      target.strokeStyle = item.appearance.accent;
      target.strokeRect(0, 0, width, height);
      target.globalAlpha = itemAlpha * surface.contentAlpha;
      drawTextRegion(target, textRegions[0]!, textColor, item.effectId, diagnostics, item.revealProgress);
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
      [...frame.items].sort((left, right) => left.zIndex - right.zIndex).filter((item) => item.visible).forEach((item) => renderItem(target, item, diagnostics, timeSec));
      return { ...frame, diagnostics };
    },
  };
}
