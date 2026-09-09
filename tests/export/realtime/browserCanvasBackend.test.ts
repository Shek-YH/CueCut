import { describe, expect, it, vi } from 'vitest';
import { createBrowserCanvasCaptureBackend } from '../../../src/export/realtime/browserCanvasBackend';

function fakeCanvas() {
  const context = { fillStyle: '', fillRect: vi.fn() };
  const track = { stop: vi.fn() };
  const stream = { getTracks: () => [track] };
  return {
    canvas: { width: 0, height: 0, getContext: () => context, captureStream: vi.fn(() => stream) },
    context,
    track,
    stream,
  };
}

describe('browser canvas capture backend', () => {
  it('creates a fixed-size video-only capture stream and releases the track', async () => {
    const fake = fakeCanvas();
    const recorder = {
      state: 'inactive',
      start: vi.fn(function (this: { state: string; onstart?: () => void }) { this.state = 'recording'; this.onstart?.(); }),
      stop: vi.fn(function (this: { state: string; ondataavailable?: (event: { data: Blob }) => void; onstop?: () => void }) {
        this.state = 'inactive';
        this.ondataavailable?.({ data: new Blob(['capture']) });
        this.onstop?.();
      }),
      ondataavailable: undefined as ((event: { data: Blob }) => void) | undefined,
      onstart: undefined as (() => void) | undefined,
      onstop: undefined as (() => void) | undefined,
      onerror: undefined as ((event: unknown) => void) | undefined,
    };
    const backend = createBrowserCanvasCaptureBackend({
      createCanvas: () => fake.canvas,
      createRecorder: () => recorder,
      isTypeSupported: (mime) => mime === 'video/webm;codecs=vp9',
      appendCanvas: vi.fn(),
      removeCanvas: vi.fn(),
    });

    await backend.prepare({ width: 1920, height: 1080, fps: 30, chromaColor: '#00FF00', renderFrame: vi.fn(), getDurationMs: () => 1000 });
    await backend.start();
    expect(fake.canvas).toMatchObject({ width: 1920, height: 1080 });
    expect(fake.canvas.captureStream).toHaveBeenCalledWith(30);
    expect(recorder.start).toHaveBeenCalledOnce();
    const outputPromise = backend.stop();
    await expect(outputPromise).resolves.toMatchObject({ stats: { mimeType: 'video/webm;codecs=vp9' } });
    expect(fake.track.stop).toHaveBeenCalled();
    await backend.dispose();
  });

  it('cancels an active recorder and removes the dedicated canvas', async () => {
    const fake = fakeCanvas();
    const recorder = { state: 'recording', stop: vi.fn(), start: vi.fn(), ondataavailable: undefined, onstart: undefined, onstop: undefined, onerror: undefined };
    const removeCanvas = vi.fn();
    const backend = createBrowserCanvasCaptureBackend({
      createCanvas: () => fake.canvas,
      createRecorder: () => recorder,
      isTypeSupported: () => true,
      appendCanvas: vi.fn(),
      removeCanvas,
    });
    await backend.prepare({ width: 1920, height: 1080, fps: 30, chromaColor: '#00FF00', renderFrame: vi.fn(), getDurationMs: () => 1000 });
    await backend.cancel();
    expect(fake.track.stop).toHaveBeenCalled();
    expect(removeCanvas).toHaveBeenCalledWith(fake.canvas);
  });
});
