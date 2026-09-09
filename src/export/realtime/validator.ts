export interface RealtimeCaptureValidationInput {
  blob: Blob;
  width: number;
  height: number;
  fps: number;
  expectedDurationMs: number;
  actualDurationMs: number;
  droppedFrames: number;
  maxTimelineDriftMs: number;
  media?: { width: number; height: number; durationMs: number; hasAudio: boolean; mimeType: string };
}

export interface RealtimeCaptureValidation {
  ok: boolean;
  errors: string[];
}

export function validateRealtimeCapture(input: RealtimeCaptureValidationInput): RealtimeCaptureValidation {
  const errors: string[] = [];
  const frameBudget = 1000 / input.fps;
  if (input.blob.size <= 0) errors.push('OUTPUT_INVALID');
  if (!input.media) errors.push('MEDIA_METADATA_MISSING');
  else {
    if (input.media.width !== input.width || input.media.height !== input.height || input.media.hasAudio) errors.push('MEDIA_PROFILE_INVALID');
    if (Math.abs(input.media.durationMs - input.expectedDurationMs) > frameBudget) errors.push('CAPTURE_DURATION_MISMATCH');
    if (input.media.mimeType !== input.blob.type) errors.push('MEDIA_MIME_MISMATCH');
  }
  if (Math.abs(input.actualDurationMs - input.expectedDurationMs) > frameBudget * 2) errors.push('CAPTURE_WALL_DURATION_MISMATCH');
  if (input.droppedFrames > 0) errors.push('CAPTURE_DROPPED_FRAMES');
  if (input.maxTimelineDriftMs > frameBudget) errors.push('CAPTURE_DRIFT_EXCEEDED');
  return { ok: errors.length === 0, errors };
}
