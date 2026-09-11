import { promises as fs, createReadStream, createWriteStream } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { projectCompositionSchema, type ProjectComposition } from '../project/schema';
import { createExportController } from '../export/controller';
import { probeVideoFile } from '../media/videoProbe';

const MAX_VIDEO_BYTES = 512 * 1024 * 1024;
const MAX_EXPORT_JSON_BYTES = 16 * 1024 * 1024;
const FRAMED_EXPORT_CONTENT_TYPE = 'application/x-cuecut-export';

export interface ExportRouteRequest {
  mode: 'full-video' | 'transparent-mov' | 'transparent-webm';
  project: ProjectComposition;
  inputPath?: string;
  signal?: AbortSignal;
}

export interface ExportRouteResult {
  outputPath: string;
  contentType: 'video/mp4' | 'video/quicktime' | 'video/webm';
  fileName: string;
  cleanup?: () => Promise<void>;
}

export type ExportRouteRunner = (input: ExportRouteRequest & { video: AsyncIterable<Uint8Array>; fileName: string }) => Promise<ExportRouteResult>;

export function createExportRoute(runner: ExportRouteRunner = createHostExportRunner()): (request: IncomingMessage, response: ServerResponse) => Promise<void> {
  return async (request, response) => {
    if (request.method !== 'POST') {
      writeJson(response, 405, { error: 'method_not_allowed' });
      return;
    }
    let result: ExportRouteResult | undefined;
    try {
      const modeHeader = headerValue(request, 'x-cuecut-export-mode');
      if (modeHeader !== 'full-video' && modeHeader !== 'transparent-mov' && modeHeader !== 'transparent-webm') throw new Error('Unsupported export mode');
      const compositionHeader = headerValue(request, 'x-cuecut-composition');
      let project: ProjectComposition;
      let video: AsyncIterable<Uint8Array> = request;
      const contentType = headerValue(request, 'content-type') ?? '';
      if (compositionHeader) {
        project = projectCompositionSchema.parse(JSON.parse(decodeURIComponent(compositionHeader)));
      } else if (modeHeader === 'full-video' && contentType.startsWith(FRAMED_EXPORT_CONTENT_TYPE)) {
        const framed = await readFramedExportRequest(request);
        project = projectCompositionSchema.parse(framed.composition);
        video = framed.video;
      } else {
        const payload = await readJsonBody(request);
        const composition = payload && typeof payload === 'object' && !Array.isArray(payload) ? (payload as Record<string, unknown>).composition : undefined;
        if (!composition) throw new Error('Canonical composition is required');
        project = projectCompositionSchema.parse(composition);
        video = emptyVideo();
      }
      result = await runner({
        mode: modeHeader,
        project,
        fileName: safeFileName(decodeURIComponent(headerValue(request, 'x-cuecut-filename') ?? (modeHeader === 'transparent-webm' ? 'video.webm' : modeHeader === 'transparent-mov' ? 'video.mov' : 'video.mp4'))),
        video,
        signal: createAbortSignal(request, response),
      });
      response.statusCode = 200;
      response.setHeader('Content-Type', result.contentType);
      response.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
      await pipeline(createReadStream(result.outputPath), response);
    } catch (error) {
      writeJson(response, 500, { error: 'export_failed', message: error instanceof Error ? error.message : 'Export failed' });
    } finally {
      await result?.cleanup?.();
    }
  };
}

export function createHostExportRunner(options: { tempRoot?: string; ffmpegPath?: string; ffprobePath?: string } = {}): ExportRouteRunner {
  return async ({ mode, project, inputPath, video, fileName, signal }) => {
    const directory = await fs.mkdtemp(join(options.tempRoot ?? tmpdir(), 'cuecut-export-'));
    const input = inputPath ?? join(directory, safeFileName(fileName));
    try {
      if (mode === 'full-video') await writeLimitedStream(video, input);
      const extension = mode === 'transparent-mov' ? 'mov' : mode === 'transparent-webm' ? 'webm' : 'mp4';
      const outputPath = join(directory, `cuecut-output.${extension}`);
      const inputMetadata = mode === 'full-video' ? await probeVideoFile(input, options.ffprobePath ?? 'ffprobe') : undefined;
      await createExportController().start({ mode, project, inputPath: mode === 'full-video' ? input : undefined, outputPath, ffmpegPath: options.ffmpegPath, ffprobePath: options.ffprobePath, signal, expectedVideoCodec: mode === 'full-video' ? 'h264' : mode === 'transparent-mov' ? 'prores' : 'vp9', expectedAudio: inputMetadata?.hasAudio });
      return {
        outputPath,
        contentType: mode === 'transparent-mov' ? 'video/quicktime' : mode === 'transparent-webm' ? 'video/webm' : 'video/mp4',
        fileName: `cuecut-export.${extension}`,
        cleanup: () => fs.rm(directory, { recursive: true, force: true }),
      };
    } catch (error) {
      await fs.rm(directory, { recursive: true, force: true });
      throw error;
    }
  };
}

function createAbortSignal(request: IncomingMessage, response: ServerResponse): AbortSignal {
  const controller = new AbortController();
  request.once('aborted', () => controller.abort());
  const responseWithEvents = response as ServerResponse & { on?: (event: string, listener: () => void) => void };
  responseWithEvents.on?.('close', () => {
    if (!response.writableEnded) controller.abort();
  });
  return controller.signal;
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

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.byteLength;
    if (bytes > MAX_EXPORT_JSON_BYTES) throw new Error('Export composition exceeds the 16MB limit');
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function readFramedExportRequest(request: IncomingMessage): Promise<{ composition: unknown; video: AsyncIterable<Uint8Array> }> {
  const iterator = request[Symbol.asyncIterator]();
  const prefixChunks: Buffer[] = [];
  let prefix = Buffer.alloc(0);
  let newlineIndex = -1;
  while (newlineIndex < 0) {
    const next = await iterator.next();
    if (next.done) throw new Error('Framed export request is missing its composition header');
    const buffer = Buffer.isBuffer(next.value) ? next.value : Buffer.from(next.value);
    prefixChunks.push(buffer);
    prefix = Buffer.concat(prefixChunks);
    newlineIndex = prefix.indexOf(0x0a);
    if (prefix.length > MAX_EXPORT_JSON_BYTES) throw new Error('Export composition exceeds the 16MB limit');
  }
  const composition = JSON.parse(prefix.subarray(0, newlineIndex).toString('utf8'));
  const firstVideoChunk = prefix.subarray(newlineIndex + 1);
  const video = (async function* (): AsyncGenerator<Uint8Array> {
    if (firstVideoChunk.byteLength > 0) yield firstVideoChunk;
    while (true) {
      const next = await iterator.next();
      if (next.done) return;
      yield Buffer.isBuffer(next.value) ? next.value : Buffer.from(next.value);
    }
  }());
  return { composition, video };
}

async function* emptyVideo(): AsyncGenerator<Uint8Array> {
  return;
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
