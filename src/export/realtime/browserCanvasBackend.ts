import { selectCaptureMimeType } from './mime';
import type { CaptureBackend, CaptureBackendOptions, CaptureBackendOutput, CaptureBackendStats } from './types';

interface RecorderLike {
  state: string;
  start(): void;
  stop(): void;
  onstart: (() => void) | null;
  ondataavailable: ((event: { data: Blob }) => void) | null;
  onstop: (() => void) | null;
  onerror: ((event: unknown) => void) | null;
}

interface StreamLike {
  getTracks(): Array<{ stop(): void }>;
  getVideoTracks?(): Array<{ stop(): void; requestFrame?(): void }>;
}

interface CaptureCanvas {
  width: number;
  height: number;
  getContext(type: '2d'): CanvasRenderingContext2D | null;
  captureStream(fps: number): StreamLike;
}

export interface BrowserCanvasCaptureDependencies {
  createCanvas?: () => CaptureCanvas;
  createRecorder?: (stream: StreamLike, mimeType: string) => RecorderLike;
  isTypeSupported?: (mimeType: string) => boolean;
  appendCanvas?: (canvas: CaptureCanvas) => void;
  removeCanvas?: (canvas: CaptureCanvas) => void;
  now?: () => number;
}

export function createBrowserCanvasCaptureBackend(dependencies: BrowserCanvasCaptureDependencies = {}): CaptureBackend {
  const createCanvas = dependencies.createCanvas ?? (() => document.createElement('canvas'));
  const createRecorder = dependencies.createRecorder ?? ((stream, mimeType) => new MediaRecorder(stream as MediaStream, { mimeType }) as unknown as RecorderLike);
  const isTypeSupported = dependencies.isTypeSupported ?? ((mimeType) => MediaRecorder.isTypeSupported(mimeType));
  const appendCanvas = dependencies.appendCanvas ?? ((canvas) => document.body.appendChild(canvas as unknown as Node));
  const removeCanvas = dependencies.removeCanvas ?? ((canvas) => (canvas as unknown as HTMLCanvasElement).remove());
  const now = dependencies.now ?? (() => performance.now());
  let canvas: CaptureCanvas | null = null;
  let stream: StreamLike | null = null;
  let recorder: RecorderLike | null = null;
  let mimeType = '';
  let codec: string | null = null;
  let chunks: Blob[] = [];
  let startedAt: number | null = null;
  let endedAt: number | null = null;
  let ownsCanvas = false;
  let videoTrack: { requestFrame?(): void } | null = null;

  const releaseCanvas = () => {
    if (canvas && ownsCanvas) dependencies.removeCanvas ? dependencies.removeCanvas(canvas) : removeCanvas(canvas);
    canvas = null;
    ownsCanvas = false;
  };
  const releaseTracks = () => {
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    videoTrack = null;
  };

  return {
    async prepare(options: CaptureBackendOptions) {
      if (canvas || recorder || stream) throw new Error('Capture backend is already prepared');
      canvas = options.canvas ?? createCanvas();
      ownsCanvas = !options.canvas;
      canvas.width = options.width;
      canvas.height = options.height;
      if (ownsCanvas) appendCanvas(canvas);
      const manualStream = canvas.captureStream(0);
      videoTrack = manualStream.getVideoTracks?.()[0] ?? null;
      if (videoTrack?.requestFrame) stream = manualStream;
      else {
        manualStream.getTracks().forEach((track) => track.stop());
        videoTrack = null;
        stream = canvas.captureStream(options.fps);
      }
      const selection = selectCaptureMimeType(isTypeSupported);
      mimeType = selection.mimeType;
      codec = selection.codec === 'unknown' ? null : selection.codec;
      chunks = [];
      const createdRecorder = createRecorder(stream, mimeType);
      recorder = createdRecorder;
      createdRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
    },
    start() {
      if (!recorder) throw new Error('Capture backend is not prepared');
      return new Promise<void>((resolve, reject) => {
        recorder!.onstart = () => {
          startedAt = now();
          endedAt = null;
          resolve();
        };
        recorder!.onerror = (event) => reject(new Error(`MediaRecorder failed: ${String(event)}`));
        recorder!.start();
      });
    },
    getStats(): CaptureBackendStats {
      return { mimeType, codec, observedFrames: 0, startedAt, endedAt };
    },
    requestFrame() {
      videoTrack?.requestFrame?.();
    },
    usesManualFrameSubmission() {
      return Boolean(videoTrack?.requestFrame);
    },
    stop() {
      if (!recorder) return Promise.reject(new Error('Capture backend is not prepared'));
      if (recorder.state === 'inactive') {
        endedAt = endedAt ?? now();
        return Promise.resolve({ blob: new Blob(chunks, { type: mimeType }), stats: this.getStats() });
      }
      return new Promise<CaptureBackendOutput>((resolve, reject) => {
        recorder!.onstop = () => {
          endedAt = now();
          releaseTracks();
          resolve({ blob: new Blob(chunks, { type: mimeType }), stats: this.getStats() });
        };
        recorder!.onerror = (event) => reject(new Error(`MediaRecorder failed: ${String(event)}`));
        recorder!.stop();
      });
    },
    async cancel() {
      if (recorder && recorder.state !== 'inactive') recorder.stop();
      endedAt = now();
      releaseTracks();
      releaseCanvas();
      recorder = null;
      chunks = [];
    },
    async dispose() {
      releaseTracks();
      releaseCanvas();
      recorder = null;
      chunks = [];
    },
  };
}
