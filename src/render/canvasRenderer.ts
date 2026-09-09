import type { ProjectComposition } from '../project/schema';
import type { Renderer } from './types';

export function createCanvasRenderer(project: ProjectComposition): Renderer {
  const evaluate = (timeSec: number) => ({
    timeSec,
    activeEffectIds: project.effects
      .filter((effect) => timeSec >= effect.time.startSec && timeSec <= effect.time.endSec)
      .map((effect) => effect.effectId),
  });

  return {
    evaluate,
    renderFrame(timeSec, target) {
      const frame = evaluate(timeSec);
      target.fillStyle = project.project.palette.background;
      target.fillRect(0, 0, target.canvas.width, target.canvas.height);
      frame.activeEffectIds.forEach((effectId, index) => {
        const effect = project.effects.find((item) => item.effectId === effectId);
        if (!effect) return;
        target.fillStyle = effect.appearance.accent;
        target.globalAlpha = 0.85;
        target.fillRect(
          effect.layout.nx * target.canvas.width,
          effect.layout.ny * target.canvas.height,
          effect.layout.nw * target.canvas.width,
          effect.layout.nh * target.canvas.height,
        );
        target.globalAlpha = 1;
        if (index === frame.activeEffectIds.length - 1) target.strokeStyle = effect.appearance.accent;
      });
      return frame;
    },
  };
}

