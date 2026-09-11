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

  it('routes transparent WebM as a first-class alpha export', async () => {
    const outputPath = 'test-results/route-output.webm';
    await writeFile(outputPath, Buffer.from('encoded-webm'));
    const runner = vi.fn(async ({ mode }: { mode: 'transparent-webm' }) => ({ outputPath, contentType: 'video/webm' as const, fileName: 'cuecut-export.webm', mode }));
    const handler = createExportRoute(runner);
    const project = createFixtureProject();
    const request = Object.assign(Readable.from([Buffer.from('')]), {
      method: 'POST',
      headers: {
        'x-cuecut-export-mode': 'transparent-webm',
        'x-cuecut-composition': encodeURIComponent(JSON.stringify(project)),
      },
    }) as unknown as IncomingMessage;
    const { response, read } = responseHarness();

    await handler(request, response);

    expect(runner.mock.calls[0]?.[0].mode).toBe('transparent-webm');
    expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'video/webm');
    expect(read()).toEqual(Buffer.from('encoded-webm'));
  });

  it('accepts transparent export composition in the JSON body', async () => {
    const outputPath = 'test-results/route-output-body.webm';
    await writeFile(outputPath, Buffer.from('encoded-body-webm'));
    const runner = vi.fn(async ({ project }: { project: ReturnType<typeof createFixtureProject> }) => ({ outputPath, contentType: 'video/webm' as const, fileName: `${project.project.projectId}.webm` }));
    const handler = createExportRoute(runner);
    const project = createFixtureProject();
    project.project.projectId = 'body-export-project';
    const request = Object.assign(Readable.from([Buffer.from(JSON.stringify({ composition: project }))]), {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-cuecut-export-mode': 'transparent-webm' },
    }) as unknown as IncomingMessage;
    const { response, read } = responseHarness();

    await handler(request, response);

    expect(runner).toHaveBeenCalledTimes(1);
    expect(runner.mock.calls[0]?.[0].project.project.projectId).toBe('body-export-project');
    expect(read()).toEqual(Buffer.from('encoded-body-webm'));
  });
});
