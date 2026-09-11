import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { describe, expect, it, vi } from 'vitest';
import { createTranscriptionRoute } from '../../src/server/transcriptionRoute';

function responseHarness() {
  let body = '';
  const response = { statusCode: 200, setHeader: vi.fn(), end: vi.fn((value?: string) => { body = value ?? ''; }) } as unknown as ServerResponse;
  return { response, read: () => JSON.parse(body) as Record<string, unknown> };
}

describe('video transcription API route', () => {
  it('passes the imported video stream to the transcription runner and returns timestamped SRT data', async () => {
    const runner = vi.fn(async ({ fileName, video }: { fileName: string; video: AsyncIterable<Uint8Array> }) => {
      let bytes = 0;
      for await (const chunk of video) bytes += chunk.byteLength;
      return {
        transcript: [{ id: 's-1', startSec: 0, endSec: 1.2, text: '字幕' }],
        warnings: [`received:${fileName}:${bytes}`],
        asrRequestId: 'asr-1',
        asrDurationSec: 1.2,
        srtFileName: 'video-asr.srt',
      };
    });
    const handler = createTranscriptionRoute(runner);
    const request = Object.assign(Readable.from([Buffer.from('video')]), {
      method: 'POST',
      headers: { 'x-cuecut-filename': encodeURIComponent('portrait.mp4') },
    }) as unknown as IncomingMessage;
    const { response, read } = responseHarness();

    await handler(request, response);

    expect(runner).toHaveBeenCalledTimes(1);
    expect(read()).toMatchObject({ warnings: ['received:portrait.mp4:5'], transcript: [{ text: '字幕' }] });
    expect(read()).not.toHaveProperty('apiKey');
  });
});
