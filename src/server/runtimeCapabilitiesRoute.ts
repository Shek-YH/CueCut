import type { IncomingMessage, ServerResponse } from 'node:http';
import type { RuntimeCapabilities } from '../contracts/runtimeCapabilities';
import { resolveRuntimeCapabilities } from './runtimeCapabilities';
import type { SettingsSecretStore } from './secretStore';
import type { VisualAssetSettingsStore } from './settingsRoute';

export function createRuntimeCapabilitiesRoute(input: { envPath: string; secrets: SettingsSecretStore; visualAssets: VisualAssetSettingsStore }) {
  return async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    if (request.method !== 'GET') {
      writeJson(response, 405, { error: 'method_not_allowed' });
      return;
    }
    try {
      const result = await resolveRuntimeCapabilities(input);
      writeJson(response, 200, result);
    } catch {
      writeJson(response, 500, { error: 'runtime_capabilities_failed', message: 'Runtime capabilities could not be read' });
    }
  };
}

function writeJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}
