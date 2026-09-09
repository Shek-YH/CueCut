export const REALTIME_CAPTURE_DEFAULTS = {
  width: 1920,
  height: 1080,
  fps: 30,
  chromaColor: '#00FF00',
  audio: false,
  warmupFrames: 3,
} as const;

export type CaptureState =
  | 'IDLE'
  | 'PREPARING'
  | 'LOADING_ASSETS'
  | 'WARMING_UP'
  | 'RECORDER_ARMED'
  | 'TIMELINE_ARMED'
  | 'CAPTURING'
  | 'PLAYING'
  | 'END_PENDING'
  | 'STOPPING'
  | 'FINALIZING'
  | 'VALIDATING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED';

export type CaptureHealthStatus = 'HEALTHY' | 'WARNING' | 'FAILED';

export type CaptureErrorCode =
  | 'CAPTURE_WINDOW_CREATE_FAILED'
  | 'MEDIA_STREAM_FAILED'
  | 'MEDIA_RECORDER_UNSUPPORTED'
  | 'MEDIA_RECORDER_START_FAILED'
  | 'ASSET_LOAD_TIMEOUT'
  | 'TIMELINE_START_FAILED'
  | 'CAPTURE_DROPPED_FRAMES'
  | 'CAPTURE_DRIFT_EXCEEDED'
  | 'OUTPUT_INVALID'
  | 'CAPTURE_CANCELLED';

export interface CaptureClockSample {
  timelineTimeMs: number;
  elapsedMs: number;
  driftMs: number;
}

export interface CaptureHealthStats {
  expectedFps: number;
  actualFps: number;
  expectedFrames: number;
  observedFrames: number;
  droppedFrames: number;
  averageDriftMs: number;
  maxDriftMs: number;
  finalDriftMs: number;
  wallClockMs: number;
  recordingDurationMs: number;
  timelineDurationMs: number;
  fileSizeBytes: number | null;
  warnings: string[];
  errors: string[];
  status: CaptureHealthStatus;
}

export interface CaptureBackendStats {
  mimeType: string;
  codec: string | null;
  observedFrames: number;
  startedAt: number | null;
  endedAt: number | null;
}

export interface CaptureBackendOutput {
  blob: Blob;
  stats: CaptureBackendStats;
}

export interface CaptureBackendOptions {
  width: number;
  height: number;
  fps: number;
  chromaColor: string;
  renderFrame: (timeMs: number) => void;
  getDurationMs: () => number;
  canvas?: HTMLCanvasElement;
}

export interface RealtimeCaptureResult {
  jobId: string;
  blob: Blob;
  fileName: string;
  mimeType: string;
  width: number;
  height: number;
  fps: number;
  expectedDurationMs: number;
  actualDurationMs: number;
  health: CaptureHealthStats;
  validation: { ok: boolean; errors: string[] };
  media: { width: number; height: number; durationMs: number; hasAudio: boolean; mimeType: string };
}

export interface CaptureBackend {
  prepare(options: CaptureBackendOptions): Promise<void>;
  start(): Promise<void>;
  getStats(): CaptureBackendStats;
  stop(): Promise<CaptureBackendOutput>;
  requestFrame?(): void;
  usesManualFrameSubmission?(): boolean;
  cancel(): Promise<void>;
  dispose(): Promise<void>;
}
