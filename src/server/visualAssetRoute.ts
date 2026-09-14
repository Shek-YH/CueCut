import type { IncomingMessage, ServerResponse } from 'node:http';
import type { VisualAssetProvider } from './visualAssetProvider';
import { createDisabledVisualAssetProvider } from './visualAssetProvider';
import type { VisualAssetSettingsStore } from './settingsRoute';

export function createVisualAssetRoute(input: { provider?: VisualAssetProvider; settings?: VisualAssetSettingsStore } = {}) {
  const provider = input.provider ?? createDisabledVisualAssetProvider();
  return async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    try {
      if (request.method !== 'POST') { writeJson(response, 405, { error: 'method_not_allowed' }); return; }
      const body = await readBody(request);
      const payload = body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : {};
      const result = await provider.generate({ styleId: typeof payload.styleId === 'string' ? payload.styleId : 'tech_neon_3d', atlasPlans: Array.isArray(payload.atlasPlans) ? payload.atlasPlans : [], referenceImage: payload.referenceImage ?? null });
      writeJson(response, 200, { ok: true, ...result });
    } catch (error) {
      writeJson(response, 502, { ok: false, error: 'visual_asset_generation_failed', message: error instanceof Error ? error.message : 'Visual asset generation failed' });
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
