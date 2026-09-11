import type { IncomingMessage, ServerResponse } from 'node:http';
import { promises as fs } from 'node:fs';
import { resolve } from 'node:path';
import { createBailianProvider } from '../director/bailianProvider';
import { createPackagingDirector, type PackagingProvider } from '../packaging-ai/service';
import type { PackagingPlan } from '../packaging-ir/schema';
import { readBailianApiKey } from './generationRoute';

const MAX_BODY_BYTES = 8 * 1024 * 1024;

export interface PackagingRouteRequest {
  analysis: unknown;
  preferences: Record<string, unknown>;
  project?: Record<string, unknown>;
}

export interface PackagingRouteResponse {
  plan: PackagingPlan;
  aiCallCount: 1;
  repaired: boolean;
}

export type PackagingRunner = (input: PackagingRouteRequest) => Promise<PackagingRouteResponse>;

export function createPackagingRoute(runner: PackagingRunner) {
  return async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    if (request.method !== 'POST') {
      writeJson(response, 405, { error: 'method_not_allowed' });
      return;
    }
    try {
      const payload = await readJsonBody(request);
      const input = normalizeRequest(payload);
      writeJson(response, 200, await runner(input));
    } catch (error) {
      writeJson(response, 500, { error: 'packaging_generation_failed', message: error instanceof Error ? error.message : 'Packaging generation failed' });
    }
  };
}

export function createHostPackagingRunner(options: { projectRoot?: string; envPath?: string; model?: string; fetchImpl?: typeof fetch } = {}): PackagingRunner {
  const projectRoot = options.projectRoot ?? process.cwd();
  const envPath = options.envPath ?? resolve(projectRoot, '测试素材与api', '.env');
  return async (input) => {
    const apiKey = await readBailianApiKey(envPath);
    const provider = createBailianProvider({ apiKey, model: options.model ?? 'qwen-plus', fetchImpl: options.fetchImpl });
    const packagingProvider: PackagingProvider = ({ systemPrompt, request }) => provider({ messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(request) },
    ] });
    return createPackagingDirector(packagingProvider).generate({ analysis: input.analysis, preferences: input.preferences, project: input.project ?? null });
  };
}

function normalizeRequest(value: unknown): PackagingRouteRequest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Packaging request must be a JSON object');
  const record = value as Record<string, unknown>;
  const preferences = record.preferences;
  if (!preferences || typeof preferences !== 'object' || Array.isArray(preferences)) throw new Error('Packaging preferences are required');
  return { analysis: record.analysis ?? {}, preferences: preferences as Record<string, unknown>, project: record.project && typeof record.project === 'object' && !Array.isArray(record.project) ? record.project as Record<string, unknown> : undefined };
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.byteLength;
    if (bytes > MAX_BODY_BYTES) throw new Error('Packaging request exceeds the 8MB limit');
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function writeJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}
