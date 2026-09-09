import { createCanvasRenderer } from '../../render/canvasRenderer';
import type { ProjectComposition } from '../../project/schema';

export interface CaptureSceneSurface {
  canvas: HTMLCanvasElement;
  render(timeMs: number): void;
  dispose(): void;
}

export async function waitForCaptureAssets(documentImpl: Document = document): Promise<void> {
  const fonts = (documentImpl as Document & { fonts?: FontFaceSet }).fonts;
  if (fonts) await fonts.ready;
  const images = Array.from(documentImpl.images);
  await Promise.all(images.map((image) => image.decode?.() ?? Promise.resolve()));
}

export function createCaptureSceneSurface(
  project: ProjectComposition,
  options: { width: number; height: number; chromaColor: string; documentImpl?: Document } ,
): CaptureSceneSurface {
  const documentImpl = options.documentImpl ?? document;
  const canvas = documentImpl.createElement('canvas');
  canvas.width = options.width;
  canvas.height = options.height;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.dataset.cuecutCaptureScene = 'true';
  canvas.style.position = 'fixed';
  canvas.style.left = '-100000px';
  canvas.style.top = '0';
  canvas.style.pointerEvents = 'none';
  canvas.style.visibility = 'hidden';
  documentImpl.body.appendChild(canvas);
  const context = canvas.getContext('2d');
  if (!context) {
    canvas.remove();
    throw new Error('Capture canvas 2D context is unavailable');
  }
  const renderer = createCanvasRenderer(project, { background: options.chromaColor });
  return {
    canvas,
    render(timeMs) {
      renderer.renderFrame(timeMs / 1000, context);
    },
    dispose() {
      canvas.remove();
    },
  };
}
