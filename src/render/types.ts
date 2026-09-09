import type { ProjectComposition } from '../project/schema';
import type { SceneFrame } from './scene';

export type RenderFrame = SceneFrame;

export interface Renderer {
  evaluate(timeSec: number): RenderFrame;
  renderFrame(timeSec: number, target: CanvasRenderingContext2D): RenderFrame;
}

export type RendererFactory = (project: ProjectComposition) => Renderer;
