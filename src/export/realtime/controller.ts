import { createCaptureSceneSurface, type CaptureSceneSurface, waitForCaptureAssets } from './captureScene';
import { createCaptureClock, frameTimeMs } from './clock';
import { createCaptureHealthMonitor } from './health';
import { createRealtimeCaptureFileName } from './finalizer';
import { createCaptureStateMachine } from './stateMachine';
import { REALTIME_CAPTURE_DEFAULTS, type CaptureBackend, type CaptureBackendOptions, type CaptureState, type RealtimeCaptureResult } from './types';
import { validateRealtimeCapture } from './validator';
import { probeCapturedMedia } from './mediaMetadata';
import type { ProjectComposition } from '../../project/schema';

interface ControllerDependencies {
  backend: CaptureBackend;
  forceEnabled?: boolean;
  now?: () => number;
  waitForNextFrame?: () => Promise<void>;
  createSurface?: (project: ProjectComposition, options: { width: number; height: number; chromaColor: string }) => CaptureSceneSurface;
  onState?: (state: CaptureState) => void;
  probeMedia?: (blob: Blob) => Promise<{ width: number; height: number; durationMs: number; hasAudio: boolean; mimeType: string }>;
}

export function createRealtimeCaptureController(dependencies: ControllerDependencies) {
  const now = dependencies.now ?? (() => performance.now());
  const waitForNextFrame = dependencies.waitForNextFrame ?? (() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
  const createSurface = dependencies.createSurface ?? createCaptureSceneSurface;
  let active = false;
  let cancelRequested = false;
  let cancelPromise: Promise<void> | null = null;
  let machine = createCaptureStateMachine();

  const emit = (state: CaptureState) => dependencies.onState?.(state);
  const transition = (event: Parameters<typeof machine.transition>[0]) => emit(machine.transition(event));

  return {
    async start(input: { project: ProjectComposition; projectName?: string; durationSecOverride?: number }): Promise<RealtimeCaptureResult> {
      if (active) throw new Error('Realtime capture is already running');
      if (dependencies.forceEnabled !== true) throw new Error('Realtime Chroma Capture is disabled');
      const durationSec = input.durationSecOverride ?? input.project.project.durationSec;
      if (!Number.isFinite(durationSec) || durationSec <= 0) throw new Error('Capture duration must be positive');
      active = true;
      cancelRequested = false;
      cancelPromise = null;
      machine = createCaptureStateMachine();
      const durationMs = durationSec * 1000;
      const clock = createCaptureClock({ durationMs, fps: REALTIME_CAPTURE_DEFAULTS.fps });
      let surface: CaptureSceneSurface | null = null;
      const startWallClock = now();
      try {
        transition('PREPARE');
        surface = createSurface(input.project, REALTIME_CAPTURE_DEFAULTS);
        const renderFrame = (timeMs: number) => {
          surface?.render(timeMs);
          dependencies.backend.requestFrame?.();
        };
        const backendOptions: CaptureBackendOptions = {
          ...REALTIME_CAPTURE_DEFAULTS,
          canvas: surface.canvas,
          renderFrame,
          getDurationMs: () => durationMs,
        };
        await waitForCaptureAssets();
        transition('ASSETS_READY');
        for (let frame = 0; frame < REALTIME_CAPTURE_DEFAULTS.warmupFrames; frame += 1) renderFrame(0);
        transition('WARMUP_READY');
        await dependencies.backend.prepare(backendOptions);
        if (cancelRequested) throw new Error('Capture cancelled');
        const health = createCaptureHealthMonitor({ fps: REALTIME_CAPTURE_DEFAULTS.fps, durationMs, manualFrameSubmission: dependencies.backend.usesManualFrameSubmission?.() === true });
        transition('RECORDER_READY');
        renderFrame(0);
        transition('TIMELINE_READY');
        await dependencies.backend.start();
        const captureStart = now();
        clock.start(captureStart);
        renderFrame(0);
        health.recordFrame({ frameIndex: 0, timelineTimeMs: 0, wallClockMs: captureStart });
        transition('CAPTURE_STARTED');
        transition('PLAYBACK_STARTED');
        const expectedFrames = Math.max(1, Math.ceil(durationMs / 1000 * REALTIME_CAPTURE_DEFAULTS.fps));
        for (let frame = 1; frame < expectedFrames; frame += 1) {
          if (cancelRequested) throw new Error('Capture cancelled');
          const targetMs = frameTimeMs(frame, REALTIME_CAPTURE_DEFAULTS.fps);
          while (now() - captureStart < targetMs) await waitForNextFrame();
          const wallClockMs = now();
          const timelineTimeMs = clock.timeMsAt(wallClockMs);
          renderFrame(timelineTimeMs);
          health.recordFrame({ frameIndex: frame, timelineTimeMs, wallClockMs });
        }
        transition('END_REACHED');
        renderFrame(durationMs);
        await waitForNextFrame();
        const finalFrameWallClock = now();
        health.recordFrame({ frameIndex: expectedFrames, timelineTimeMs: durationMs, wallClockMs: finalFrameWallClock });
        const output = await dependencies.backend.stop();
        transition('RECORDER_STOPPED');
        transition('FINALIZED');
        transition('VALIDATION_STARTED');
        const endWallClock = now();
        const healthStats = health.finish(endWallClock, { timelineDurationMs: durationMs, fileSizeBytes: output.blob.size });
        const media = await (dependencies.probeMedia ?? ((blob: Blob) => probeCapturedMedia(blob)))(output.blob);
        const validation = validateRealtimeCapture({
          blob: output.blob,
          width: REALTIME_CAPTURE_DEFAULTS.width,
          height: REALTIME_CAPTURE_DEFAULTS.height,
          fps: REALTIME_CAPTURE_DEFAULTS.fps,
          expectedDurationMs: durationMs,
          actualDurationMs: media.durationMs,
          droppedFrames: healthStats.droppedFrames,
          maxTimelineDriftMs: healthStats.maxDriftMs,
          media,
        });
        if (healthStats.status === 'FAILED' && !validation.errors.includes('CAPTURE_HEALTH_FAILED')) validation.errors.push('CAPTURE_HEALTH_FAILED');
        if (!validation.ok || healthStats.status === 'FAILED') {
          transition('FAIL');
          throw new Error(`Capture validation failed: ${validation.errors.join(', ')}`);
        }
        transition('VALIDATED');
        return {
          blob: output.blob,
          fileName: createRealtimeCaptureFileName(input.projectName ?? input.project.project.projectId, Date.now(), output.stats.mimeType.includes('mp4') ? 'mp4' : 'webm'),
          mimeType: output.stats.mimeType,
          width: REALTIME_CAPTURE_DEFAULTS.width,
          height: REALTIME_CAPTURE_DEFAULTS.height,
          fps: REALTIME_CAPTURE_DEFAULTS.fps,
          expectedDurationMs: durationMs,
          actualDurationMs: media.durationMs,
          health: { ...healthStats, wallClockMs: endWallClock - startWallClock },
          validation,
          media,
        };
      } catch (error) {
        if (cancelRequested) {
          if (machine.getState() !== 'CANCELLED') {
            try { transition('CANCEL'); } catch { /* backend cleanup remains authoritative */ }
          }
          throw new Error('Capture cancelled');
        }
        if (machine.getState() !== 'FAILED') {
          try { transition('FAIL'); } catch { /* preserve original error */ }
        }
        throw error;
      } finally {
        await cancelPromise;
        await dependencies.backend.dispose();
        surface?.dispose();
        active = false;
      }
    },
    cancel(): void {
      if (!active || cancelPromise) return;
      cancelRequested = true;
      cancelPromise = dependencies.backend.cancel();
    },
  };
}
