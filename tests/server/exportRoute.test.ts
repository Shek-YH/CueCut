import { Readable } from 'node:stream';
import { PassThrough } from 'node:stream';
import { writeFile } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { describe, expect, it, vi } from 'vitest';
import { createFixtureProject } from '../../src/project/fixtures';
import { createExportRoute } from '../../src/server/exportRoute';

function responseHarness() {
  let body = Buffer.alloc(0);
  const response = new PassThrough() as PassThrough & { statusCode: number; setHeader: ReturnType<typeof vi.fn> };
  response.statusCode = 200;
  response.setHeader = vi.fn();
  response.on('data', (chunk) => { body = Buffer.concat([body, chunk]); });
  return { response, read: () => body };
}

describe('actual export API route', () => {
  it('validates the canonical composition and returns the generated media bytes', async () => {
    const outputPath = 'test-results/route-output.mp4';
    await writeFile(outputPath, Buffer.from('encoded-media'));
    const runner = vi.fn(async ({ project, signal }: { project: ReturnType<typeof createFixtureProject>; signal: AbortSignal }) => ({ outputPath, contentType: 'video/mp4', fileName: `${project.project.projectId}.mp4`, signal }));
    const handler = createExportRoute(runner);
    const project = createFixtureProject();
    project.project.projectId = 'export-route-project';
    const request = Object.assign(Readable.from([Buffer.from('video')]), {
      method: 'POST',
      headers: {
        'x-cuecut-export-mode': 'full-video',
        'x-cuecut-composition': encodeURIComponent(JSON.stringify(project)),
        'x-cuecut-filename': encodeURIComponent('input.mp4'),
      },
    }) as unknown as IncomingMessage;
    const { response, read } = responseHarness();

    await handler(request, response);

    expect(runner).toHaveBeenCalledTimes(1);
    expect(runner.mock.calls[0]?.[0].signal).toBeInstanceOf(AbortSignal);
    expect(response.statusCode).toBe(200);
    expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'video/mp4');
    expect(read()).toEqual(Buffer.from('encoded-media'));
  });
});
