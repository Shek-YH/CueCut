import { promises as fs } from 'node:fs';
import { readBailianModel } from './generationRoute';
import type { SettingsSecretStore } from './secretStore';
import { createVisualAssetSettingsStore, type VisualAssetSettingsStore } from './settingsRoute';
import type { RuntimeCapabilities } from '../contracts/runtimeCapabilities';

export async function resolveRuntimeCapabilities(input: { envPath: string; secrets: SettingsSecretStore; visualAssets?: VisualAssetSettingsStore }): Promise<RuntimeCapabilities> {
  const secretKey = input.secrets.get('bailianApiKey');
  const envKey = secretKey ? null : await readEnvApiKey(input.envPath);
  const model = await readConfiguredModel(input.envPath);
  const directorConfigured = Boolean((secretKey ?? envKey) && model);
  const visualAssets = input.visualAssets?.get() ?? createVisualAssetSettingsStore().get();
  const visualKeyConfigured = Boolean(input.secrets.get('visualAssetApiKey'));
  const visualReady = visualAssets.provider !== 'disabled' && visualKeyConfigured && Boolean(visualAssets.endpoint && visualAssets.model);

  return {
    ok: true,
    director: {
      configured: directorConfigured,
      verified: false,
      model: model ?? null,
      source: secretKey ? 'secret-store' : envKey ? 'env' : 'none',
      ...(!directorConfigured ? { reason: 'API Key or model is not configured' } : {}),
    },
    visualAssets: {
      mode: visualAssets.provider === 'disabled' ? 'disabled' : visualReady ? 'ready' : 'misconfigured',
      provider: visualAssets.provider,
      model: visualAssets.model || null,
      ...(!visualReady && visualAssets.provider !== 'disabled' ? { reason: 'Provider, API Key, endpoint or model is not configured' } : {}),
    },
  };
}

async function readConfiguredModel(envPath: string): Promise<string | null> {
  const override = process.env.CUECUT_DIRECTOR_MODEL?.trim();
  if (override) return override;
  try {
    const lines = (await fs.readFile(envPath, 'utf8')).split(/\r?\n/);
    const line = lines.find((item) => /^\s*model\s*=\s*\S+/.test(item));
    return line?.replace(/^\s*model\s*=\s*/, '').trim() || null;
  } catch {
    return null;
  }
}

async function readEnvApiKey(envPath: string): Promise<string | null> {
  try {
    const lines = (await fs.readFile(envPath, 'utf8')).split(/\r?\n/);
    const sectionIndex = lines.findIndex((line) => line.trim() === '阿里云百炼');
    const line = sectionIndex >= 0
      ? lines.slice(sectionIndex + 1).find((item) => /^\s*API KEY\s*=/.test(item))
      : lines.find((item) => /^\s*(API KEY|api_key)\s*=/.test(item));
    const value = line?.replace(/^\s*(API KEY|api_key)\s*=\s*/, '').trim();
    return value || null;
  } catch {
    return null;
  }
}
