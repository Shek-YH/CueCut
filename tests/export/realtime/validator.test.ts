import { describe, expect, it } from 'vitest';
import { validateRealtimeCapture } from '../../../src/export/realtime/validator';

describe('realtime capture validator', () => {
  it('accepts a non-empty 1080p30 result within one frame of the timeline', () => {
    expect(validateRealtimeCapture({
      blob: new Blob(['video']), width: 1920, height: 1080, fps: 30, expectedDurationMs: 1000,
      actualDurationMs: 1008, droppedFrames: 0, maxTimelineDriftMs: 12,
      media: { width: 1920, height: 1080, durationMs: 1008, hasAudio: false, mimeType: '' },
    })).toEqual({ ok: true, errors: [] });
  });

  it('rejects duration mismatch and dropped frames so failed media cannot be reported as success', () => {
    expect(validateRealtimeCapture({
      blob: new Blob(['video']), width: 1920, height: 1080, fps: 30, expectedDurationMs: 1000,
      actualDurationMs: 800, droppedFrames: 2, maxTimelineDriftMs: 50,
      media: { width: 1920, height: 1080, durationMs: 800, hasAudio: false, mimeType: '' },
    })).toEqual({ ok: false, errors: ['CAPTURE_DURATION_MISMATCH', 'CAPTURE_WALL_DURATION_MISMATCH', 'CAPTURE_DROPPED_FRAMES', 'CAPTURE_DRIFT_EXCEEDED'] });
  });
});
