import type { IncomingMessage, ServerResponse } from 'node:http';
import { createUserSecretStore, type SettingsSecretStore } from './secretStore';

export { type SettingsSecretStore } from './secretStore';

export function createSettingsRoute(store: SettingsSecretStore = createUserSecretStore()) {
  return async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    try {
      if (request.method === 'GET') {
        writeJson(response, 200, { ok: true, bailianApiKeyConfigured: store.has('bailianApiKey') });
        return;
      }
      if (request.method !== 'POST') {
        writeJson(response, 405, { error: 'method_not_allowed' });
        return;
      }
      const body = await readBody(request);
      const value = body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>).apiKey : null;
      if (typeof value !== 'string' || !value.trim()) throw new Error('API key is required');
      store.set('bailianApiKey', value);
      writeJson(response, 200, { ok: true, bailianApiKeyConfigured: true });
    } catch (error) {
      writeJson(response, 400, { error: 'settings_update_failed', message: error instanceof Error ? error.message : 'Settings update failed' });
    }
  };
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
