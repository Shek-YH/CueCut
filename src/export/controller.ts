/// <reference types="node" />
import { once } from 'node:events';
import { rm, stat } from 'node:fs/promises';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import type { Writable } from 'node:stream';
import { createRawVideoFfmpegCommand, type RawVideoFfmpegInput } from './ffmpeg';
import { frameCount, renderProjectFrame } from './renderer';
import { probeVideoFile, type VideoMetadata } from '../media/videoProbe';
import type { ProjectComposition } from '../project/schema';

export type ExportState = 'Preparing' | 'Rendering' | 'Encoding' | 'Finalizing' | 'Done' | 'Failed' | 'Cancelled';

interface SpawnedProcess {
  stdin: Writable;
  kill(signal?: NodeJS.Signals): boolean;
  on(event: 'close', listener: (code: number | null) => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
}

interface ExportControllerDependencies {
  spawnProcess?: (command: string, args: string[]) => SpawnedProcess;
  probe?: (path: string, ffprobePath: string) => Promise<VideoMetadata>;
  onState?: (state: ExportState) => void;
  onProgress?: (completedFrames: number, totalFrames: number) => void;
}

export interface ExportRequest {
  mode: 'full-video' | 'transparent-mov';
  project: ProjectComposition;
  outputPath: string;
  inputPath?: string;
  ffmpegPath?: string;
  ffprobePath?: string;
  signal?: AbortSignal;
  expectedVideoCodec?: string;
  expectedAudio?: boolean;
}

export interface ExportResult {
  outputPath: string;
  metadata: VideoMetadata;
}

function writeChunk(stream: Writable, chunk: Buffer, cancelSignal: Promise<never>): Promise<void> {
  if (stream.write(chunk)) return Promise.resolve();
  return Promise.race([once(stream, 'drain').then(() => undefined), cancelSignal]);
}

function waitForProcess(child: SpawnedProcess): Promise<number> {
  return new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', (code) => resolve(code ?? -1));
  });
}

function assertOutputMetadata(project: ProjectComposition, mode: ExportRequest['mode'], metadata: VideoMetadata): void {
  if (metadata.width !== project.project.canvasWidth || metadata.height !== project.project.canvasHeight) throw new Error('Export resolution does not match the composition');
  if (Math.abs(metadata.fps - project.project.fps) > 0.02) throw new Error('Export frame rate does not match the composition');
  if (Math.abs(metadata.durationSec - project.project.durationSec) > Math.max(0.15, 2 / project.project.fps)) throw new Error('Export duration does not match the composition');
  if (mode === 'transparent-mov' && !/(yuva|rgba|argb)/i.test(metadata.pixelFormat)) throw new Error('Transparent MOV does not contain an alpha-capable pixel format');
}

export function createExportController(dependencies: ExportControllerDependencies = {}) {
  const spawnProcess = dependencies.spawnProcess ?? ((command, args) => spawn(command, args, { windowsHide: true }) as unknown as SpawnedProcess);
  const probe = dependencies.probe ?? probeVideoFile;
  let state: ExportState = 'Preparing';
  let child: SpawnedProcess | null = null;
  let rejectCancellation: ((reason: Error) => void) | null = null;
  let cancelRequested = false;
  let running = false;

  const cancelCurrent = (): void => {
    if (!running) return;
    cancelRequested = true;
    rejectCancellation?.(new Error('Export cancelled'));
    child?.stdin.destroy();
    child?.kill();
  };

  const setState = (next: ExportState) => {
    state = next;
    dependencies.onState?.(next);
  };

  const start = async (request: ExportRequest): Promise<ExportResult> => {
    if (running) throw new Error('Export is already running');
    running = true;
    cancelRequested = false;
    const abortListener = () => cancelCurrent();
    request.signal?.addEventListener('abort', abortListener, { once: true });
    setState('Preparing');
    try {
      const { project } = request;
      const cancelSignal = new Promise<never>((_resolve, reject) => { rejectCancellation = reject; });
      const rawInput: RawVideoFfmpegInput = request.mode === 'full-video'
        ? { mode: 'full-video', inputPath: request.inputPath ?? (() => { throw new Error('Full-video export requires inputPath'); })(), outputPath: request.outputPath, width: project.project.canvasWidth, height: project.project.canvasHeight, fps: project.project.fps, durationSec: project.project.durationSec }
        : { mode: 'transparent-mov', outputPath: request.outputPath, width: project.project.canvasWidth, height: project.project.canvasHeight, fps: project.project.fps, durationSec: project.project.durationSec };
      const args = createRawVideoFfmpegCommand(rawInput);
      child = spawnProcess(request.ffmpegPath ?? 'ffmpeg', args);
      const processDone = waitForProcess(child);
      setState('Rendering');
      const totalFrames = frameCount(project);
      for (let frame = 0; frame < totalFrames; frame += 1) {
        if (cancelRequested) throw new Error('Export cancelled');
        await writeChunk(child.stdin, renderProjectFrame(project, frame / project.project.fps), cancelSignal);
        dependencies.onProgress?.(frame + 1, totalFrames);
      }
      child.stdin.end();
      setState('Encoding');
      const code = await processDone;
      child = null;
      rejectCancellation = null;
      request.signal?.removeEventListener('abort', abortListener);
      if (cancelRequested) throw new Error('Export cancelled');
      if (code !== 0) throw new Error(`FFmpeg failed with exit code ${code}`);
      setState('Finalizing');
      const outputStats = await stat(request.outputPath);
      if (outputStats.size <= 0) throw new Error('Export output is empty');
      const metadata = await probe(request.outputPath, request.ffprobePath ?? 'ffprobe');
      assertOutputMetadata(project, request.mode, metadata);
      if (request.expectedVideoCodec && !metadata.codec.toLowerCase().includes(request.expectedVideoCodec.toLowerCase())) throw new Error('Export codec does not match the requested output codec');
      if (request.expectedAudio !== undefined && metadata.hasAudio !== request.expectedAudio) throw new Error('Export audio stream does not match the input expectation');
      setState('Done');
      return { outputPath: request.outputPath, metadata };
    } catch (error) {
      if (cancelRequested) {
        setState('Cancelled');
        await rm(request.outputPath, { force: true });
      } else {
        setState('Failed');
      }
      throw error;
    } finally {
      child = null;
      rejectCancellation = null;
      request.signal?.removeEventListener('abort', abortListener);
      running = false;
    }
  };

  return {
    start,
    cancel(): void {
      cancelCurrent();
    },
    getState: () => state,
  };
}
