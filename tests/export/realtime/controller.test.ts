import { describe, expect, it, vi } from 'vitest';
import { createFixtureProject } from '../../../src/project/fixtures';
import { createRealtimeCaptureController } from '../../../src/export/realtime/controller';
import type { CaptureBackend } from '../../../src/export/realtime/types';

function fakeBackend(events: string[]): CaptureBackend {
  return {
    prepare: vi.fn(async () => { events.push('prepare'); }),
    start: vi.fn(async () => { events.push('start'); }),
    getStats: vi.fn(() => ({ mimeType: 'video/webm;codecs=vp9', codec: 'vp9', observedFrames: 0, startedAt: 0, endedAt: 100 })),
    stop: vi.fn(async () => { events.push('stop'); return { blob: new Blob(['video']), stats: { mimeType: 'video/webm;codecs=vp9', codec: 'vp9', observedFrames: 0, startedAt: 0, endedAt: 100 } }; }),
    cancel: vi.fn(async () => { events.push('cancel'); }),
    dispose: vi.fn(async () => { events.push('dispose'); }),
  };
}

describe('realtime capture controller', () => {
  it('starts recording before timeline playback and reaches success after finalization', async () => {
    const events: string[] = [];
    const states: string[] = [];
    const controller = createRealtimeCaptureController({
      backend: fakeBackend(events),
      forceEnabled: true,
      onState: (state) => states.push(state),
      now: (() => { let value = 0; return () => (value += 1); })(),
      waitForNextFrame: async () => undefined,
      createSurface: () => ({ canvas: {} as HTMLCanvasElement, render: vi.fn(), dispose: vi.fn() }),
      probeMedia: async (blob) => ({ width: 1920, height: 1080, durationMs: 100, hasAudio: false, mimeType: blob.type }),
    });
    const project = createFixtureProject();
    project.project.durationSec = 0.1;
    const result = await controller.start({ project });
    expect(events.indexOf('start')).toBeLessThan(events.indexOf('stop'));
    expect(states).toContain('RECORDER_ARMED');
    expect(states.at(-1)).toBe('SUCCESS');
    expect(result.validation.ok).toBe(true);
  });

  it('cancels through the backend and does not report success', async () => {
    const backend = fakeBackend([]);
    const controller = createRealtimeCaptureController({
      backend,
      forceEnabled: true,
      waitForNextFrame: async () => undefined,
      now: (() => { let value = 0; return () => (value += 1); })(),
      createSurface: () => ({ canvas: {} as HTMLCanvasElement, render: vi.fn(), dispose: vi.fn() }),
      probeMedia: async (blob) => ({ width: 1920, height: 1080, durationMs: 1000, hasAudio: false, mimeType: blob.type }),
    });
    const project = createFixtureProject();
    const promise = controller.start({ project });
    controller.cancel();
    await expect(promise).rejects.toThrow(/cancel/i);
    expect(backend.cancel).toHaveBeenCalledOnce();
  });
});
