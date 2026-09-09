import { describe, expect, it } from 'vitest';
import { selectCaptureMimeType } from '../../../src/export/realtime/mime';

describe('capture MIME selection', () => {
  it('prefers supported MP4 and falls back to WebM without assuming a codec', () => {
    const supported = new Set(['video/webm;codecs=vp9', 'video/webm']);
    expect(selectCaptureMimeType((mime) => supported.has(mime))).toEqual({
      mimeType: 'video/webm;codecs=vp9',
      container: 'webm',
      codec: 'vp9',
    });
  });

  it('reports an explicit unsupported error when no candidate is available', () => {
    expect(() => selectCaptureMimeType(() => false)).toThrow(/MediaRecorder is unsupported/);
  });
});
