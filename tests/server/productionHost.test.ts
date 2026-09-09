import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { createServer, request as httpRequest } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { createProductionServer } from '../../src/server/productionHost';

describe('production host boundary', () => {
  it('creates an HTTP server from the same generation route used by dev', () => {
    const server = createProductionServer({ runner: vi.fn() });

    expect(server).toBeDefined();
    expect(server.listenerCount('request')).toBe(1);
    server.close();
  });

  it('serves the production frontend and keeps API routes separate', async () => {
    const webRoot = await mkdtemp(join(tmpdir(), 'cuecut-host-test-'));
    await writeFile(join(webRoot, 'index.html'), '<!doctype html><title>CueCut production</title>');
    const server = createProductionServer({ webRoot, runner: vi.fn() });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('server did not bind');

    const response = await new Promise<{ status: number; body: string }>((resolve, reject) => {
      const request = httpRequest({ host: '127.0.0.1', port: address.port, path: '/', method: 'GET' }, (incoming) => {
        let body = '';
        incoming.setEncoding('utf8');
        incoming.on('data', (chunk) => { body += chunk; });
        incoming.on('end', () => resolve({ status: incoming.statusCode ?? 0, body }));
      });
      request.on('error', reject);
      request.end();
    });

    expect(response).toEqual({ status: 200, body: '<!doctype html><title>CueCut production</title>' });
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await rm(webRoot, { recursive: true, force: true });
  });
});
