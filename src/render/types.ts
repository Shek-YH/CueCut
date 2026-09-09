import type { ProjectComposition } from '../project/schema';

export interface RenderFrame {
  timeSec: number;
  activeEffectIds: string[];
}

export interface Renderer {
  evaluate(timeSec: number): RenderFrame;
  renderFrame(timeSec: number, target: CanvasRenderingContext2D): RenderFrame;
}

export type RendererFactory = (project: ProjectComposition) => Renderer;

