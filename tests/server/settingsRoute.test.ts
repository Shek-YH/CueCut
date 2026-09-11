import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { describe, expect, it, vi } from 'vitest';
import { createSettingsRoute, type SettingsSecretStore } from '../../src/server/settingsRoute';

function responseHarness() {
  let body = '';
  const response = { statusCode: 200, setHeader: vi.fn(), end: vi.fn((value?: string) => { body = value ?? ''; }) } as unknown as ServerResponse;
  return { response, read: () => JSON.parse(body) as Record<string, unknown> };
}

function request(body: unknown, method = 'POST') {
  return Object.assign(Readable.from([Buffer.from(JSON.stringify(body))]), { method, headers: { 'content-type': 'application/json' } }) as unknown as IncomingMessage;
}

describe('settings route', () => {
  it('stores the API key without returning the secret', async () => {
    let value: string | null = null;
    const store: SettingsSecretStore = { get: () => value, set: (_name, next) => { value = next; }, has: () => Boolean(value) };
    const handler = createSettingsRoute(store);
    const first = responseHarness();
    await handler(request({ apiKey: 'synthetic-secret' }), first.response);
    expect(first.read()).toEqual({ ok: true, bailianApiKeyConfigured: true });
    expect(JSON.stringify(first.read())).not.toContain('synthetic-secret');

    const second = responseHarness();
    await handler(request({}, 'GET'), second.response);
    expect(second.read()).toEqual({ ok: true, bailianApiKeyConfigured: true });
  });
});
