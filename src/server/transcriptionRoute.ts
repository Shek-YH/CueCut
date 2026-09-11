import { promises as fs, createWriteStream } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createBailianAsrClient } from '../media/bailianAsr';
import { serializeSrt, type TranscriptSegment } from '../subtitles/srt';
import { readBailianApiKey } from './generationRoute';

const MAX_VIDEO_BYTES = 512 * 1024 * 1024;
const MAX_AUDIO_BASE64_BYTES = 10 * 1024 * 1024;

export interface TranscriptionRouteRequest {
  fileName: string;
  video: AsyncIterable<Uint8Array>;
}

export interface TranscriptionRouteResponse {
  transcript: TranscriptSegment[];
  warnings: string[];
  asrRequestId: string;
  asrDurationSec: number;
  srtFileName: string;
}

export type TranscriptionRunner = (input: TranscriptionRouteRequest) => Promise<TranscriptionRouteResponse>;

export function createTranscriptionRoute(runner: TranscriptionRunner) {
  return async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    if (request.method !== 'POST') {
      writeJson(response, 405, { error: 'method_not_allowed' });
      return;
    }
    try {
      const headerValue = request.headers['x-cuecut-filename'];
      const encodedName = Array.isArray(headerValue) ? headerValue[0] : headerValue;
      const fileName = basename(decodeURIComponent(encodedName || 'video.mp4')) || 'video.mp4';
      writeJson(response, 200, await runner({ fileName, video: request }));
    } catch (error) {
      writeJson(response, 500, { error: 'transcription_failed', message: error instanceof Error ? error.message : 'Transcription failed' });
    }
  };
}

export function createHostTranscriptionRunner(options: { projectRoot?: string; envPath?: string; ffmpegPath?: string; tempRoot?: string; fetchImpl?: typeof fetch } = {}): TranscriptionRunner {
  const projectRoot = options.projectRoot ?? process.cwd();
  const envPath = options.envPath ?? resolve(projectRoot, '测试素材与api', '.env');
  return async (input) => {
    const temporaryDirectory = await fs.mkdtemp(join(options.tempRoot ?? tmpdir(), 'cuecut-transcription-'));
    const videoPath = join(temporaryDirectory, safeFileName(input.fileName));
    const audioPath = join(temporaryDirectory, 'audio.mp3');
    try {
      await writeLimitedStream(input.video, videoPath);
      await runProcess(options.ffmpegPath ?? 'ffmpeg', ['-y', '-i', videoPath, '-vn', '-ac', '1', '-ar', '16000', '-codec:a', 'libmp3lame', '-b:a', '64k', audioPath]);
      const audioBytes = await fs.readFile(audioPath);
      if (audioBytes.byteLength > MAX_AUDIO_BASE64_BYTES) throw new Error('Extracted audio exceeds the 10MB Base64 request limit');
      const apiKey = await readBailianApiKey(envPath);
      const result = await createBailianAsrClient({ apiKey, model: 'qwen-audio-3.0-asr-flash', fetchImpl: options.fetchImpl }).transcribe({
        audioDataUri: 'data:audio/mpeg;base64,' + audioBytes.toString('base64'),
        format: 'mp3',
        sampleRate: 16000,
        languageHints: ['zh'],
      });
      const outputDirectory = resolve(projectRoot, 'renders');
      await fs.mkdir(outputDirectory, { recursive: true });
      const outputStem = safeFileName(input.fileName).replace(/\.[^.]+$/, '') || 'cuecut-transcription';
      const srtFileName = `${outputStem}-asr.srt`;
      await fs.writeFile(join(outputDirectory, srtFileName), serializeSrt(result.segments), 'utf8');
      return { transcript: result.segments, warnings: [], asrRequestId: result.requestId, asrDurationSec: result.processedDurationSec, srtFileName };
    } finally {
      await fs.rm(temporaryDirectory, { recursive: true, force: true });
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

function runProcess(command: string, args: string[]): Promise<string> {
  return new Promise((resolveOutput, reject) => {
    const child = spawn(command, args, { windowsHide: true });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? resolveOutput(stdout) : reject(new Error(`${command} failed with exit code ${code}: ${stderr.slice(-500)}`)));
  });
}

function safeFileName(fileName: string): string {
  return basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_') || 'video.mp4';
}

function writeJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}
