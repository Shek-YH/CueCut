import { Readable } from 'node:stream';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { describe, expect, it, vi } from 'vitest';
import { createFixtureProject } from '../../src/project/fixtures';
import { createGenerationRoute, createHostGenerationRunner } from '../../src/server/generationRoute';

function responseHarness() {
  let body = '';
  const response = {
    statusCode: 200,
    setHeader: vi.fn(),
    end: vi.fn((value?: string) => { body = value ?? ''; }),
  } as unknown as ServerResponse;
  return { response, read: () => JSON.parse(body) as Record<string, unknown> };
}

describe('generation API route', () => {
  it('passes the imported video stream to the host runner without returning secrets', async () => {
    const runner = vi.fn(async ({ fileName, video }: { fileName: string; video: AsyncIterable<Uint8Array> }) => {
      let bytes = 0;
      for await (const chunk of video) bytes += chunk.byteLength;
      return {
        transcript: [],
        composition: createFixtureProject(),
        warnings: [`received:${fileName}:${bytes}`],
        usedFallback: false,
        selectionTrace: [],
        asrRequestId: 'asr-1',
        asrDurationSec: 1,
      };
    });
    const handler = createGenerationRoute(runner);
    const request = Object.assign(Readable.from([Buffer.from('video')]), {
      method: 'POST',
      headers: { 'x-cuecut-filename': encodeURIComponent('portrait.mp4') },
    }) as unknown as IncomingMessage;
    const { response, read } = responseHarness();

    await handler(request, response);

    expect(runner).toHaveBeenCalledTimes(1);
    expect(read()).toMatchObject({ warnings: ['received:portrait.mp4:5'] });
    expect(read()).not.toHaveProperty('apiKey');
  });

  it('rejects methods other than POST', async () => {
    const handler = createGenerationRoute(vi.fn());
    const request = Object.assign(Readable.from([]), { method: 'GET', headers: {} }) as unknown as IncomingMessage;
    const { response, read } = responseHarness();

    await handler(request, response);

    expect(response.statusCode).toBe(405);
    expect(read()).toEqual({ error: 'method_not_allowed' });
  });

  it('rejects an unconfigured host generation before invoking ffmpeg', async () => {
    const appData = mkdtempSync(join(tmpdir(), 'cuecut-empty-secrets-'));
    const previousAppData = process.env.APPDATA;
    process.env.APPDATA = appData;
    try {
      const runner = createHostGenerationRunner({ envPath: 'F:/missing/cuecut-preflight.env', ffmpegPath: 'missing-ffmpeg', ffprobePath: 'missing-ffprobe' });
      await expect(runner({ fileName: 'video.mp4', video: Readable.from([Buffer.from('video')]), preferenceProfile: {} })).rejects.toMatchObject({ statusCode: 409, code: 'DIRECTOR_PROVIDER_NOT_CONFIGURED' });
    } finally {
      if (previousAppData === undefined) delete process.env.APPDATA;
      else process.env.APPDATA = previousAppData;
      rmSync(appData, { recursive: true, force: true });
    }
  });
});
