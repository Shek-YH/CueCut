import { promises as fs, createWriteStream } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { probeVideoFile, type VideoMetadata } from '../media/videoProbe';

const MAX_VIDEO_BYTES = 512 * 1024 * 1024;

export type ProbeRouteRunner = (input: { fileName: string; video: AsyncIterable<Uint8Array> }) => Promise<VideoMetadata>;

export function createProbeRoute(runner: ProbeRouteRunner = createHostProbeRunner()): (request: IncomingMessage, response: ServerResponse) => Promise<void> {
  return async (request, response) => {
    if (request.method !== 'POST') {
      writeJson(response, 405, { error: 'method_not_allowed' });
      return;
    }
    try {
      const header = request.headers['x-cuecut-filename'];
      const encodedName = Array.isArray(header) ? header[0] : header;
      const fileName = safeFileName(decodeURIComponent(encodedName ?? 'video.mp4'));
      const metadata = await runner({ fileName, video: request });
      writeJson(response, 200, metadata);
    } catch (error) {
      writeJson(response, 500, { error: 'probe_failed', message: error instanceof Error ? error.message : 'Probe failed' });
    }
  };
}

export function createHostProbeRunner(options: { tempRoot?: string; ffprobePath?: string } = {}): ProbeRouteRunner {
  return async ({ fileName, video }) => {
    const directory = await fs.mkdtemp(join(options.tempRoot ?? tmpdir(), 'cuecut-probe-'));
    const inputPath = join(directory, fileName);
    try {
      await writeLimitedStream(video, inputPath);
      return await probeVideoFile(inputPath, options.ffprobePath ?? 'ffprobe');
    } finally {
      await fs.rm(directory, { recursive: true, force: true });
    }
  };
}

async function writeLimitedStream(source: AsyncIterable<Uint8Array>, targetPath: string): Promise<void> {
  let bytes = 0;
  const limiter = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      bytes += chunk.byteLength;
      callback(bytes > MAX_VIDEO_BYTES ? new Error('Video exceeds the 512MB local upload limit') : null, chunk);
    },
  });
  await pipeline(source, limiter, createWriteStream(targetPath));
}

function safeFileName(fileName: string): string {
  const name = basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
  return name || 'video.mp4';
}

function writeJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}
