import { PassThrough, Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { describe, expect, it, vi } from 'vitest';
import { createRealtimeCaptureRoute } from '../../src/server/realtimeCaptureRoute';

function responseHarness() {
  let body = '';
  const response = new PassThrough() as PassThrough & { statusCode: number; setHeader: ReturnType<typeof vi.fn> };
  response.statusCode = 200;
  response.setHeader = vi.fn();
  response.on('data', (chunk) => { body += chunk.toString(); });
  return { response, read: () => JSON.parse(body) as Record<string, unknown> };
}

describe('realtime capture persistence route', () => {
  it('persists the raw capture through the temp store and returns a sanitized artifact record', async () => {
    const persist = vi.fn(async () => ({ jobId: 'job-1', directory: 'temp', fileName: 'capture.webm', outputPath: 'temp/capture.webm', size: 12 }));
    const handler = createRealtimeCaptureRoute({ persist });
    const request = Object.assign(Readable.from([Buffer.from('capture')]), { method: 'POST', headers: { 'x-cuecut-job-id': 'job-1', 'x-cuecut-filename': encodeURIComponent('capture.webm') } }) as unknown as IncomingMessage;
    const { response, read } = responseHarness();

    await handler(request, response);

    expect(persist).toHaveBeenCalledTimes(1);
    expect(response.statusCode).toBe(200);
    expect(read()).toEqual({ jobId: 'job-1', fileName: 'capture.webm', size: 12 });
  });
});
