import { randomUUID } from 'node:crypto';
import { promises as fs, createWriteStream } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { effectRegistry } from '../effects/registry';
import { motionRegistry } from '../motions/registry';
import { sfxRegistry } from '../sfx/registry';
import { createBailianAsrClient, type BailianAsrResult } from '../media/bailianAsr';
import { probeVideoFile } from '../media/videoProbe';
import { createBailianProvider } from '../director/bailianProvider';
import { createDirectorService, type DirectorResult } from '../director/service';
import type { DirectorInput } from '../director/types';
import { buildDirectorMessages } from '../director/prompt';
import { createLocalFallbackComposition } from '../director/localFallback';
import { projectCompositionSchema, type ProjectComposition } from '../project/schema';
import { createGenerationWorkflow, type GenerationInput } from '../generation/workflow';
import { serializeSrt } from '../subtitles/srt';
import { createUnavailableVisualContext } from '../layout/visualContext';
import { createUserSecretStore } from './secretStore';

const MAX_VIDEO_BYTES = 512 * 1024 * 1024;
const MAX_AUDIO_BASE64_BYTES = 10 * 1024 * 1024;

export interface GenerationApiResponse {
  transcript: BailianAsrResult['segments'];
  composition: ProjectComposition;
  warnings: string[];
  usedFallback: boolean;
  selectionTrace: NonNullable<DirectorResult['selectionTrace']>;
  asrRequestId: string;
  asrDurationSec: number;
  outputFiles: { srtFileName: string; compositionFileName: string };
}

export interface GenerationRouteRequest {
  fileName: string;
  video: AsyncIterable<Uint8Array>;
  preferenceProfile: Record<string, unknown>;
}

export type GenerationRunner = (input: GenerationRouteRequest) => Promise<GenerationApiResponse>;

export function createGenerationRoute(runner: GenerationRunner) {
  return async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    if (request.method !== 'POST') {
      writeJson(response, 405, { error: 'method_not_allowed' });
      return;
    }

    try {
      const headerValue = request.headers['x-cuecut-filename'];
      const encodedName = Array.isArray(headerValue) ? headerValue[0] : headerValue;
      const fileName = basename(decodeURIComponent(encodedName || 'video.mp4')) || 'video.mp4';
      const preferenceHeader = request.headers['x-cuecut-preferences'];
      const encodedPreferences = Array.isArray(preferenceHeader) ? preferenceHeader[0] : preferenceHeader;
      const preferenceProfile = parsePreferenceProfile(encodedPreferences);
      const result = await runner({ fileName, video: request, preferenceProfile });
      writeJson(response, 200, result);
    } catch (error) {
      writeJson(response, 500, {
        error: 'generation_failed',
        message: error instanceof Error ? error.message : 'Generation failed',
      });
    }
  };
}

export function createHostGenerationRunner(options: {
  projectRoot?: string;
  envPath?: string;
  skillPath?: string;
  ffmpegPath?: string;
  ffprobePath?: string;
  tempRoot?: string;
  fetchImpl?: typeof fetch;
} = {}): GenerationRunner {
  const projectRoot = options.projectRoot ?? process.cwd();
  const envPath = options.envPath ?? resolve(projectRoot, '测试素材与api', '.env');
  const skillPath = options.skillPath ?? resolve(projectRoot, 'CueCut_Director_SKILL.md');

  return async (input) => {
    const temporaryDirectory = await fs.mkdtemp(join(options.tempRoot ?? tmpdir(), 'cuecut-generation-'));
    const videoPath = join(temporaryDirectory, safeFileName(input.fileName));
    const audioPath = join(temporaryDirectory, 'audio.mp3');

    try {
      await writeLimitedStream(input.video, videoPath);
      const metadata = await probeVideoFile(videoPath, options.ffprobePath ?? 'ffprobe');
      await runProcess(options.ffmpegPath ?? 'ffmpeg', [
        '-y', '-i', videoPath, '-vn', '-ac', '1', '-ar', '16000',
        '-codec:a', 'libmp3lame', '-b:a', '64k', audioPath,
      ]);
      const audioBytes = await fs.readFile(audioPath);
      if (audioBytes.byteLength > MAX_AUDIO_BASE64_BYTES) {
        throw new Error('Extracted audio exceeds the 10MB Base64 request limit');
      }

      const apiKey = await readBailianApiKey(envPath);
      const skill = await fs.readFile(skillPath, 'utf8');
      const project = {
        projectId: 'cuecut-' + randomUUID(),
        durationSec: metadata.durationSec,
        fps: metadata.fps,
        canvasWidth: metadata.width,
        canvasHeight: metadata.height,
        aspectRatio: aspectRatio(metadata.width, metadata.height),
        platformHint: null,
        contentStyleHint: 'tutorial',
      } satisfies DirectorInput['project'];
      const generationInput: GenerationInput = {
        project,
        visualContext: createUnavailableVisualContext({
          subtitleReservedZone: { nx: 0.05, ny: 0.78, nw: 0.9, nh: 0.17 },
          safeMargins: 0.05,
          optionalSceneHints: ['Use the supplied video dimensions and preserve the detected aspect ratio.'],
        }),
        effects: effectRegistry,
        motions: motionRegistry.map((motion) => ({ id: motion.motionId, tags: [motion.category, ...motion.recommendedEffectFamilies] })),
        sfx: sfxRegistry.map((sfx) => ({ id: sfx.sfxId, tags: sfx.tags, isFavorite: sfx.isFavorite, usageScore: sfx.usageScore })),
        preferences: input.preferenceProfile,
      };

      const asrClient = createBailianAsrClient({
        apiKey,
        model: 'qwen-audio-3.0-asr-flash',
        fetchImpl: options.fetchImpl,
      });
      const directorProvider = createBailianProvider({
        apiKey,
        model: 'qwen-plus',
        fetchImpl: options.fetchImpl,
      });
      const directorService = createDirectorService(
        directorProvider,
        (directorInput) => createLocalFallbackComposition(directorInput as Partial<DirectorInput>),
      );
      const workflow = createGenerationWorkflow({
        extractAudio: async () => ({
          audioDataUri: 'data:audio/mpeg;base64,' + audioBytes.toString('base64'),
          format: 'mp3' as const,
          sampleRate: 16000,
        }),
        transcribe: (audio) => asrClient.transcribe({
          audioDataUri: audio.audioDataUri,
          format: audio.format,
          sampleRate: audio.sampleRate,
          languageHints: ['zh'],
        }),
        generateDirector: (directorInput) => directorService.generate({
          ...directorInput,
          messages: buildDirectorMessages(skill, directorInput),
        }),
      });
      const result = await workflow.generate(generationInput);
      const composition = projectCompositionSchema.parse({
        ...result.director.composition,
        project: {
          ...result.director.composition.project,
          ...project,
          video: { sourceFileName: input.fileName, zIndex: 0, locked: true },
        },
      });
      const outputDirectory = resolve(projectRoot, 'renders');
      await fs.mkdir(outputDirectory, { recursive: true });
      const outputStem = safeFileName(input.fileName).replace(/\.[^.]+$/, '') || 'cuecut-generation';
      const srtFileName = `${outputStem}-asr.srt`;
      const compositionFileName = `${outputStem}-cuecut-composition.json`;
      await fs.writeFile(join(outputDirectory, srtFileName), serializeSrt(result.transcript), 'utf8');
      await fs.writeFile(join(outputDirectory, compositionFileName), JSON.stringify(composition, null, 2), 'utf8');

      return {
        transcript: result.transcript,
        composition,
        warnings: result.director.warnings,
        usedFallback: result.director.usedFallback,
        selectionTrace: result.director.selectionTrace ?? [],
        asrRequestId: result.asr.requestId,
        asrDurationSec: result.asr.processedDurationSec,
        outputFiles: { srtFileName, compositionFileName },
      };
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
    child.on('close', (code) => {
      if (code === 0) resolveOutput(stdout);
      else reject(new Error(`${command} failed with exit code ${code}: ${stderr.slice(-500)}`));
    });
  });
}

export async function readBailianApiKey(envPath: string): Promise<string> {
  const configured = createUserSecretStore().get('bailianApiKey');
  if (configured) return configured;
  const lines = (await fs.readFile(envPath, 'utf8')).split(/\r?\n/);
  const sectionIndex = lines.findIndex((line) => line.trim() === '阿里云百炼');
  if (sectionIndex < 0) throw new Error('Alibaba Bailian section is missing from the local env file');
  const keyLine = lines.slice(sectionIndex + 1).find((line) => /^API KEY\s*=/.test(line));
  const key = keyLine?.replace(/^API KEY\s*=\s*/, '').trim();
  if (!key) throw new Error('Alibaba Bailian API key is not configured in the local env file');
  return key;
}

function parsePreferenceProfile(encoded: string | undefined): Record<string, unknown> {
  if (!encoded) return {};
  try {
    const parsed = JSON.parse(decodeURIComponent(encoded)) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function safeFileName(fileName: string): string {
  const name = basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
  return name || 'video.mp4';
}

function aspectRatio(width: number, height: number): string {
  let left = Math.round(width);
  let right = Math.round(height);
  while (right !== 0) {
    const remainder = left % right;
    left = right;
    right = remainder;
  }
  return `${Math.round(width / left)}:${Math.round(height / left)}`;
}

function writeJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}
