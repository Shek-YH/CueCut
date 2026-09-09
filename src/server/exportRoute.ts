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

export interface ExportRouteRequest {
  mode: 'full-video' | 'transparent-mov';
  project: ProjectComposition;
  inputPath?: string;
  signal?: AbortSignal;
}

export interface ExportRouteResult {
  outputPath: string;
  contentType: 'video/mp4' | 'video/quicktime';
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
      if (modeHeader !== 'full-video' && modeHeader !== 'transparent-mov') throw new Error('Unsupported export mode');
      const compositionHeader = headerValue(request, 'x-cuecut-composition');
      if (!compositionHeader) throw new Error('Canonical composition is required');
      const project = projectCompositionSchema.parse(JSON.parse(decodeURIComponent(compositionHeader)));
      result = await runner({
        mode: modeHeader,
        project,
        fileName: safeFileName(decodeURIComponent(headerValue(request, 'x-cuecut-filename') ?? 'video.mp4')),
        video: request,
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
      const outputPath = join(directory, `cuecut-output.${mode === 'transparent-mov' ? 'mov' : 'mp4'}`);
      const inputMetadata = mode === 'full-video' ? await probeVideoFile(input, options.ffprobePath ?? 'ffprobe') : undefined;
      await createExportController().start({ mode, project, inputPath: mode === 'full-video' ? input : undefined, outputPath, ffmpegPath: options.ffmpegPath, ffprobePath: options.ffprobePath, signal, expectedVideoCodec: mode === 'full-video' ? 'h264' : 'prores', expectedAudio: inputMetadata?.hasAudio });
      return {
        outputPath,
        contentType: mode === 'transparent-mov' ? 'video/quicktime' : 'video/mp4',
        fileName: `cuecut-export.${mode === 'transparent-mov' ? 'mov' : 'mp4'}`,
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

function headerValue(request: IncomingMessage, name: string): string | undefined {
  const value = request.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

function writeJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}
