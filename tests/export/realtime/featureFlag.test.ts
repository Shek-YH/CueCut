import { describe, expect, it } from 'vitest';
import { isRealtimeChromaCaptureEnabled } from '../../../src/export/realtime/featureFlag';

describe('realtime chroma feature flag', () => {
  it('is off by default and only enables on an explicit true value', () => {
    expect(isRealtimeChromaCaptureEnabled({})).toBe(false);
    expect(isRealtimeChromaCaptureEnabled({ VITE_REALTIME_CHROMA_CAPTURE: 'false' })).toBe(false);
    expect(isRealtimeChromaCaptureEnabled({ VITE_REALTIME_CHROMA_CAPTURE: 'true' })).toBe(true);
  });
});
