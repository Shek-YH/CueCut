import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { describe, expect, it, vi } from 'vitest';
import { createPackagingRoute } from '../../src/server/packagingRoute';

function responseHarness() {
  let body = '';
  const response = { statusCode: 200, setHeader: vi.fn(), end: vi.fn((value?: string) => { body = value ?? ''; }) } as unknown as ServerResponse;
  return { response, read: () => JSON.parse(body) as Record<string, unknown> };
}

describe('Packaging AI route', () => {
  it('passes structured analysis/preferences to the runner and returns the validated plan', async () => {
    const plan = { schemaVersion: '1.0', projectId: 'p', canvas: { width: 1080, height: 1920, aspectRatio: '9:16', fps: 30 }, globalStyle: { visualStyle: 'clean-tech', energy: 0.5, density: 'auto', paletteIntent: 'brand', motionIntensity: 0.5 }, timeline: [], constraints: { maxConcurrentOverlays: 2, allowBehindSubject: false, subjectAvoidPadding: 0.1, edgeInsets: { top: 0.04, bottom: 0.08, left: 0.05, right: 0.05 } }, exportHints: { formats: ['mp4'], transparent: false } };
    const runner = vi.fn(async (input: { analysis: unknown; preferences: unknown }) => ({ plan, aiCallCount: 1, repaired: false, analysisKeys: Object.keys(input.analysis as object), preferences: input.preferences }));
    const handler = createPackagingRoute(runner);
    const request = Object.assign(Readable.from([Buffer.from(JSON.stringify({ analysis: { transcript: [] }, preferences: { density: 'auto' } }))]), { method: 'POST', headers: { 'content-type': 'application/json' } }) as unknown as IncomingMessage;
    const { response, read } = responseHarness();

    await handler(request, response);

    expect(runner).toHaveBeenCalledTimes(1);
    expect(read()).toMatchObject({ plan, aiCallCount: 1, analysisKeys: ['transcript'] });
  });
});
