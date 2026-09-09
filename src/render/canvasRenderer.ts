import type { ProjectComposition } from '../project/schema';
import { evaluateSceneAtTime, type SceneItem } from './scene';
import type { Renderer } from './types';

export function createCanvasRenderer(project: ProjectComposition): Renderer {
  const evaluate = (timeSec: number) => evaluateSceneAtTime(project, timeSec);

  const renderItem = (target: CanvasRenderingContext2D, item: SceneItem) => {
    const width = item.layout.nw * target.canvas.width;
    const height = item.layout.nh * target.canvas.height;
    target.save();
    target.globalAlpha = item.opacity;
    target.filter = item.blur > 0 ? `blur(${item.blur}px)` : 'none';
    target.translate(item.layout.nx * target.canvas.width, item.layout.ny * target.canvas.height);
    target.translate(item.translate.x, item.translate.y);
    target.rotate(item.rotation * Math.PI / 180);
    target.scale(item.scale, item.scale);
    target.fillStyle = item.appearance.accent;
    if (item.visualTags.includes('Chart')) {
      const bars = [0.28, 0.52, 0.4, 0.76, 0.62];
      bars.forEach((bar, index) => target.fillRect(10 + index * (width / 6), height * (1 - bar), Math.max(4, width / 12), height * bar));
    }
    if (item.visualTags.includes('Badge') || item.visualTags.includes('Icon')) target.fillRect(width * 0.08, height * 0.08, Math.min(width * 0.28, height * 0.42), Math.min(height * 0.28, width * 0.42));
    if (item.visualTags.includes('Pointer') || item.visualTags.includes('Highlight')) target.fillRect(width * 0.12, height * 0.78, width * 0.76, Math.max(3, height * 0.05));

    if (item.content.kind === 'number') {
      target.fillRect(0, 0, width, height);
      target.fillStyle = item.appearance.theme === 'dark' ? '#FFFFFF' : '#10141C';
      target.font = '700 42px sans-serif';
      target.textAlign = 'center';
      target.fillText(String(item.content.value), width / 2, height / 2);
    } else if (item.content.kind === 'text') {
      target.fillStyle = item.appearance.theme === 'dark' ? '#FFFFFF' : '#10141C';
      target.font = '700 32px sans-serif';
      target.textAlign = 'center';
      target.fillText(item.content.text, width / 2, height / 2);
    } else if (item.content.kind === 'list') {
      target.fillRect(0, 0, width, height);
      target.fillStyle = item.appearance.theme === 'dark' ? '#FFFFFF' : '#10141C';
      target.font = '600 24px sans-serif';
      target.textAlign = 'left';
      item.content.items.forEach((entry, index) => target.fillText(`${index + 1}. ${entry}`, 16, 34 + index * 34));
    } else {
      target.globalAlpha *= 0.85;
      target.fillRect(0, 0, width, height);
      target.globalAlpha = item.opacity;
      target.strokeStyle = item.appearance.accent;
      target.strokeRect(0, 0, width, height);
      target.fillStyle = '#FFFFFF';
      target.font = '600 24px sans-serif';
      target.textAlign = 'center';
      target.fillText(item.content.label, width / 2, height / 2);
    }
    target.restore();
  };

  return {
    evaluate,
    renderFrame(timeSec, target) {
      const frame = evaluate(timeSec);
      target.fillStyle = project.project.palette.background;
      target.fillRect(0, 0, target.canvas.width, target.canvas.height);
      [...frame.items].sort((left, right) => left.zIndex - right.zIndex).filter((item) => item.visible).forEach((item) => renderItem(target, item));
      return frame;
    },
  };
}
