import { Readable } from 'node:stream';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { describe, expect, it, vi } from 'vitest';
import { createPersistentVisualAssetSettingsStore, createSettingsRoute, type SettingsSecretStore } from '../../src/server/settingsRoute';

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
    let bailian: string | null = null;
    let visualAsset: string | null = null;
    const store: SettingsSecretStore = {
      get: (name) => name === 'bailianApiKey' ? bailian : visualAsset,
      set: (name, next) => { if (name === 'bailianApiKey') bailian = next; else visualAsset = next; },
      has: (name) => Boolean(name === 'bailianApiKey' ? bailian : visualAsset),
    };
    const handler = createSettingsRoute(store);
    const first = responseHarness();
    await handler(request({ apiKey: 'synthetic-secret' }), first.response);
    expect(first.read()).toMatchObject({ ok: true, bailianApiKeyConfigured: true, visualAssetApiKeyConfigured: false, visualAssetProvider: 'disabled' });
    expect(JSON.stringify(first.read())).not.toContain('synthetic-secret');

    const second = responseHarness();
    await handler(request({}, 'GET'), second.response);
    expect(second.read()).toMatchObject({ ok: true, bailianApiKeyConfigured: true, visualAssetApiKeyConfigured: false, visualAssetProvider: 'disabled' });
  });

  it('persists visual asset settings without writing the API key into the settings file', () => {
    const directory = mkdtempSync(join(tmpdir(), 'cuecut-settings-'));
    const filePath = join(directory, 'visual-assets.json');
    try {
      const first = createPersistentVisualAssetSettingsStore(filePath);
      first.update({ provider: 'openai-compatible', endpoint: 'https://images.example.test/v1', model: 'qwen3.8-flash', maxAssets: 7 });

      const second = createPersistentVisualAssetSettingsStore(filePath);
      expect(second.get()).toMatchObject({ provider: 'openai-compatible', endpoint: 'https://images.example.test/v1', model: 'qwen3.8-flash', maxAssets: 7 });
      expect(JSON.stringify(second.get())).not.toContain('api-key');
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
