import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { describe, expect, it, vi } from 'vitest';
import { createDisabledVisualAssetProvider, createVisualAssetProvider } from '../../src/server/visualAssetProvider';
import { createVisualAssetRoute } from '../../src/server/visualAssetRoute';
import { createVisualAssetSettingsStore } from '../../src/server/settingsRoute';
import type { SettingsSecretStore } from '../../src/server/secretStore';

function responseHarness() {
  let body = '';
  const response = { statusCode: 200, setHeader: vi.fn(), end: vi.fn((value?: string) => { body = value ?? ''; }) } as unknown as ServerResponse;
  return { response, read: () => JSON.parse(body) as Record<string, unknown> };
}

function request(body: unknown, method = 'POST') {
  return Object.assign(Readable.from([Buffer.from(JSON.stringify(body))]), { method, headers: { 'content-type': 'application/json' } }) as unknown as IncomingMessage;
}

function secrets(value: string | null): SettingsSecretStore {
  return { get: () => value, has: () => Boolean(value), set: () => undefined };
}

describe('visual asset route', () => {
  it('returns a disabled result without provider work or secret data', async () => {
    const handler = createVisualAssetRoute({ provider: createDisabledVisualAssetProvider(), settings: createVisualAssetSettingsStore() });
    const result = responseHarness();

    await handler(request({ styleId: 'tech_neon_3d', atlasPlans: [] }), result.response);

    expect(result.read()).toEqual({ ok: true, status: 'disabled', assets: [] });
    expect(JSON.stringify(result.read())).not.toContain('apiKey');
  });

  it('preserves returned asset ids and sends only the frozen atlas plan', async () => {
    let body: Record<string, unknown> | undefined;
    const handler = createVisualAssetRoute({
      provider: undefined,
      settings: createVisualAssetSettingsStore({ provider: 'openai-compatible', endpoint: 'https://images.example.test', model: 'image-model' }),
    });
    const result = responseHarness();
    const provider = {
      async generate(input: { styleId: string; atlasPlans: unknown[]; referenceImage?: unknown }) {
        body = { styleId: input.styleId, atlasPlans: input.atlasPlans as unknown };
        return { status: 'generated' as const, assets: [{ assetId: 'ai_robot', page: 0, imageBase64: 'png' }] };
      },
    };
    const generatedHandler = createVisualAssetRoute({ provider, settings: createVisualAssetSettingsStore() });
    await generatedHandler(request({ styleId: 'tech_neon_3d', atlasPlans: [{ slots: [{ assetId: 'ai_robot' }] }], transcript: 'must-not-be-forwarded', video: 'must-not-be-forwarded' }), result.response);

    expect(result.read()).toMatchObject({ ok: true, status: 'generated', assets: [{ assetId: 'ai_robot' }] });
    expect(body).toEqual({ styleId: 'tech_neon_3d', atlasPlans: [{ slots: [{ assetId: 'ai_robot' }] }] });
  });

  it('keeps asset ids returned by the configured Provider', async () => {
    const provider = createVisualAssetProvider({
      settings: createVisualAssetSettingsStore({ provider: 'openai-compatible', endpoint: 'https://images.example.test', model: 'image-model' }),
      secrets: secrets('visual-secret'),
      fetchImpl: async () => new Response(JSON.stringify({ assets: [{ assetId: 'ai_robot', page: 0, imageBase64: 'png' }] }), { status: 200 }),
    });
    await expect(provider.generate({ styleId: 'tech_neon_3d', atlasPlans: [] })).resolves.toMatchObject({ assets: [{ assetId: 'ai_robot', page: 0, imageBase64: 'png' }] });
  });
});
