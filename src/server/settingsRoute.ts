import type { IncomingMessage, ServerResponse } from 'node:http';
import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { createUserSecretStore, type SettingsSecretStore } from './secretStore';

export { type SettingsSecretStore } from './secretStore';

export interface VisualAssetSettings {
  provider: 'disabled' | 'openai-compatible' | 'custom';
  endpoint: string;
  model: string;
  defaultStyle: string;
  maxAssets: number;
  maxAssetsPerAtlas: 25;
  referenceImageConditioning: 'auto' | 'on' | 'off';
}

export interface VisualAssetSettingsStore {
  get(): VisualAssetSettings;
  update(update: Partial<VisualAssetSettings>): VisualAssetSettings;
}

const defaultVisualAssetSettings: VisualAssetSettings = {
  provider: 'disabled', endpoint: '', model: '', defaultStyle: 'tech_neon_3d', maxAssets: 12, maxAssetsPerAtlas: 25, referenceImageConditioning: 'auto',
};

export function createVisualAssetSettingsStore(initial: Partial<VisualAssetSettings> = {}): VisualAssetSettingsStore {
  let value = { ...defaultVisualAssetSettings, ...initial };
  return { get: () => ({ ...value }), update: (update) => { value = { ...value, ...update, maxAssetsPerAtlas: 25 }; return { ...value }; } };
}

export function createPersistentVisualAssetSettingsStore(filePath = defaultVisualAssetSettingsPath(), initial: Partial<VisualAssetSettings> = {}): VisualAssetSettingsStore {
  let value = { ...defaultVisualAssetSettings, ...initial, ...readVisualAssetSettings(filePath) };
  return {
    get: () => ({ ...value }),
    update: (update) => {
      value = { ...value, ...update, maxAssetsPerAtlas: 25 };
      writeVisualAssetSettings(filePath, value);
      return { ...value };
    },
  };
}

export function createSettingsRoute(store: SettingsSecretStore = createUserSecretStore(), visualAssets: VisualAssetSettingsStore = createVisualAssetSettingsStore()) {
  return async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    try {
      if (request.method === 'GET') {
        writeJson(response, 200, publicSettings(store, visualAssets));
        return;
      }
      if (request.method !== 'POST') {
        writeJson(response, 405, { error: 'method_not_allowed' });
        return;
      }
      const body = await readBody(request);
      const input = body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : {};
      let changed = false;
      if (typeof input.apiKey === 'string' && input.apiKey.trim()) { store.set('bailianApiKey', input.apiKey); changed = true; }
      if (typeof input.visualAssetApiKey === 'string' && input.visualAssetApiKey.trim()) { store.set('visualAssetApiKey', input.visualAssetApiKey); changed = true; }
      const allowedProvider = input.visualAssetProvider === 'disabled' || input.visualAssetProvider === 'openai-compatible' || input.visualAssetProvider === 'custom';
      if (allowedProvider || typeof input.visualAssetEndpoint === 'string' || typeof input.visualAssetModel === 'string' || typeof input.visualAssetDefaultStyle === 'string' || typeof input.visualAssetMaxAssets === 'number' || input.referenceImageConditioning === 'auto' || input.referenceImageConditioning === 'on' || input.referenceImageConditioning === 'off') {
        visualAssets.update({
          ...(allowedProvider ? { provider: input.visualAssetProvider as VisualAssetSettings['provider'] } : {}),
          ...(typeof input.visualAssetEndpoint === 'string' ? { endpoint: input.visualAssetEndpoint } : {}),
          ...(typeof input.visualAssetModel === 'string' ? { model: input.visualAssetModel } : {}),
          ...(typeof input.visualAssetDefaultStyle === 'string' ? { defaultStyle: input.visualAssetDefaultStyle } : {}),
          ...(typeof input.visualAssetMaxAssets === 'number' ? { maxAssets: Math.max(1, Math.min(12, Math.floor(input.visualAssetMaxAssets))) } : {}),
          ...((input.referenceImageConditioning === 'auto' || input.referenceImageConditioning === 'on' || input.referenceImageConditioning === 'off') ? { referenceImageConditioning: input.referenceImageConditioning } : {}),
        });
        changed = true;
      }
      if (!changed) throw new Error('Settings update is empty');
      writeJson(response, 200, publicSettings(store, visualAssets));
    } catch (error) {
      writeJson(response, 400, { error: 'settings_update_failed', message: error instanceof Error ? error.message : 'Settings update failed' });
    }
  };
}

function publicSettings(store: SettingsSecretStore, visualAssets: VisualAssetSettingsStore): Record<string, unknown> {
  const settings = visualAssets.get();
  return { ok: true, bailianApiKeyConfigured: store.has('bailianApiKey'), visualAssetApiKeyConfigured: store.has('visualAssetApiKey'), visualAssetProvider: settings.provider, visualAssetEndpoint: settings.endpoint, visualAssetModel: settings.model, visualAssetDefaultStyle: settings.defaultStyle, visualAssetMaxAssets: settings.maxAssets, visualAssetMaxAssetsPerAtlas: 25, referenceImageConditioning: settings.referenceImageConditioning };
}

async function readBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

function writeJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}

function defaultVisualAssetSettingsPath(): string {
  const appData = process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming');
  return join(appData, 'CueCut3', 'visual-asset-settings.json');
}

function readVisualAssetSettings(filePath: string): Partial<VisualAssetSettings> {
  if (!existsSync(filePath)) return {};
  try {
    const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as Partial<VisualAssetSettings>;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? {
      ...(parsed.provider === 'disabled' || parsed.provider === 'openai-compatible' || parsed.provider === 'custom' ? { provider: parsed.provider } : {}),
      ...(typeof parsed.endpoint === 'string' ? { endpoint: parsed.endpoint } : {}),
      ...(typeof parsed.model === 'string' ? { model: parsed.model } : {}),
      ...(typeof parsed.defaultStyle === 'string' ? { defaultStyle: parsed.defaultStyle } : {}),
      ...(typeof parsed.maxAssets === 'number' ? { maxAssets: Math.max(1, Math.min(12, Math.floor(parsed.maxAssets))) } : {}),
      ...(parsed.referenceImageConditioning === 'auto' || parsed.referenceImageConditioning === 'on' || parsed.referenceImageConditioning === 'off' ? { referenceImageConditioning: parsed.referenceImageConditioning } : {}),
    } : {};
  } catch {
    return {};
  }
}

function writeVisualAssetSettings(filePath: string, value: VisualAssetSettings): void {
  mkdirSync(dirname(filePath), { recursive: true });
  const tempPath = filePath + '.tmp';
  writeFileSync(tempPath, JSON.stringify(value, null, 2), { encoding: 'utf8', mode: 0o600 });
  renameSync(tempPath, filePath);
  try { chmodSync(filePath, 0o600); } catch { /* Windows ACLs are managed by the user profile. */ }
}
