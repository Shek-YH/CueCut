import type { VisualAssetSettings, VisualAssetSettingsStore } from './settingsRoute';
import type { SettingsSecretStore } from './secretStore';

export interface VisualAssetProviderRequest {
  styleId: string;
  atlasPlans: unknown[];
  referenceImage?: unknown;
}

export interface VisualAssetProviderResult {
  status: 'disabled' | 'generated';
  assets: Array<{ page: number; imageBase64: string }>;
}

export interface VisualAssetProvider {
  generate(request: VisualAssetProviderRequest): Promise<VisualAssetProviderResult>;
}

export function createDisabledVisualAssetProvider(): VisualAssetProvider {
  return { async generate() { return { status: 'disabled', assets: [] }; } };
}

export function createVisualAssetProvider(input: { settings: VisualAssetSettingsStore; secrets: SettingsSecretStore; fetchImpl?: typeof fetch }): VisualAssetProvider {
  const fetchImpl = input.fetchImpl ?? fetch;
  return {
    async generate(request) {
      const settings: VisualAssetSettings = input.settings.get();
      if (settings.provider === 'disabled') return { status: 'disabled', assets: [] };
      const apiKey = input.secrets.get('visualAssetApiKey');
      if (!apiKey) throw new Error('Visual asset provider is not configured');
      if (!settings.endpoint || !settings.model) throw new Error('Visual asset provider endpoint and model are required');
      const response = await fetchImpl(settings.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: settings.model, styleId: request.styleId, atlasPlans: request.atlasPlans, referenceImage: request.referenceImage ?? null }) });
      if (!response.ok) throw new Error(`Visual asset provider failed with HTTP ${response.status}`);
      const payload = await response.json() as { assets?: Array<{ page: number; imageBase64: string }> };
      return { status: 'generated', assets: Array.isArray(payload.assets) ? payload.assets : [] };
    },
  };
}
