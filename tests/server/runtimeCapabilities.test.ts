import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveRuntimeCapabilities } from '../../src/server/runtimeCapabilities';
import type { SettingsSecretStore } from '../../src/server/secretStore';
import { createVisualAssetSettingsStore } from '../../src/server/settingsRoute';

function secrets(values: Record<string, string> = {}): SettingsSecretStore {
  return { get: (name) => values[name] ?? null, has: (name) => Boolean(values[name]), set: (name, value) => { values[name] = value; } };
}

describe('runtime capabilities', () => {
  it('reports an unconfigured Director without performing a remote verification', async () => {
    const result = await resolveRuntimeCapabilities({ envPath: join(tmpdir(), 'missing-cuecut.env'), secrets: secrets() });
    expect(result).toEqual({
      ok: true,
      director: { configured: false, verified: false, model: null, source: 'none', reason: 'API Key or model is not configured' },
      visualAssets: { mode: 'disabled', provider: 'disabled', model: null },
    });
  });

  it('uses the env Director model and reports a configured visual provider without returning secrets', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'cuecut-capabilities-'));
    const envPath = join(directory, '.env');
    try {
      await writeFile(envPath, 'API KEY=env-secret\nmodel=qwen3.8-flash\n', 'utf8');
      const result = await resolveRuntimeCapabilities({
        envPath,
        secrets: secrets({ visualAssetApiKey: 'visual-secret' }),
        visualAssets: createVisualAssetSettingsStore({ provider: 'openai-compatible', endpoint: 'https://images.example.test/v1', model: 'image-model' }),
      });
      expect(result.director).toMatchObject({ configured: true, verified: false, model: 'qwen3.8-flash', source: 'env' });
      expect(result.visualAssets).toEqual({ mode: 'ready', provider: 'openai-compatible', model: 'image-model' });
      expect(JSON.stringify(result)).not.toContain('secret');
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
