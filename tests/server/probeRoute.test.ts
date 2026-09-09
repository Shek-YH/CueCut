import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { describe, expect, it, vi } from 'vitest';
import { createProbeRoute } from '../../src/server/probeRoute';

describe('ffprobe host route', () => {
  it('returns ffprobe metadata for an uploaded local video', async () => {
    let body = '';
    const response = { statusCode: 200, setHeader: vi.fn(), end: vi.fn((value?: string) => { body = value ?? ''; }) } as unknown as ServerResponse;
    const runner = vi.fn(async () => ({ durationSec: 5, width: 320, height: 180, codec: 'h264', pixelFormat: 'yuv420p', rFrameRate: 30, avgFrameRate: 30, fps: 30, hasAudio: true, isVfr: false }));
    const handler = createProbeRoute(runner);
    const request = Object.assign(Readable.from([Buffer.from('video')]), { method: 'POST', headers: { 'x-cuecut-filename': encodeURIComponent('fixture.mp4') } }) as unknown as IncomingMessage;

    await handler(request, response);

    expect(runner).toHaveBeenCalledTimes(1);
    expect(JSON.parse(body)).toMatchObject({ width: 320, height: 180, fps: 30, hasAudio: true });
  });
});
