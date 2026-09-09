import type { IncomingMessage, ServerResponse } from 'node:http';
import { createRealtimeCaptureStore, type RealtimeCaptureStoredArtifact } from './realtimeCaptureStore';

type RealtimeCaptureStore = Pick<ReturnType<typeof createRealtimeCaptureStore>, 'persist'>;

export function createRealtimeCaptureRoute(store: RealtimeCaptureStore = createRealtimeCaptureStore()): (request: IncomingMessage, response: ServerResponse) => Promise<void> {
  return async (request, response) => {
    if (request.method !== 'POST') {
      writeJson(response, 405, { error: 'method_not_allowed' });
      return;
    }
    try {
      const jobId = headerValue(request, 'x-cuecut-job-id') ?? '';
      const encodedFileName = headerValue(request, 'x-cuecut-filename') ?? 'capture.webm';
      const fileName = decodeURIComponent(encodedFileName);
      if (!jobId) throw new Error('Realtime capture job id is required');
      const artifact = await store.persist({ jobId, fileName, body: request });
      writeJson(response, 200, publicArtifact(artifact));
    } catch (error) {
      writeJson(response, 500, { error: 'realtime_capture_persist_failed', message: error instanceof Error ? error.message : 'Realtime capture persistence failed' });
    }
  };
}

function publicArtifact(artifact: RealtimeCaptureStoredArtifact): Record<string, unknown> {
  return { jobId: artifact.jobId, fileName: artifact.fileName, size: artifact.size };
}

function headerValue(request: IncomingMessage, name: string): string | undefined {
  const value = request.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

function writeJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}
