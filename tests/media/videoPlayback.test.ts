import { describe, expect, it } from 'vitest';
import { createInitialBrowserPlaybackState, reduceBrowserPlaybackState, type BrowserPlaybackState } from '../../src/media/videoPlayback';

describe('browser video playback state', () => {
  it('does not report preview ready from metadata alone', () => {
    let state = createInitialBrowserPlaybackState();
    state = reduceBrowserPlaybackState(state, { type: 'source-replaced' });
    state = reduceBrowserPlaybackState(state, { type: 'loadedmetadata' });

    expect(state).toBe('metadata-ready');
    expect(state).not.toBe('can-play');
  });

  it('reports can-play only after the browser can render media data', () => {
    let state: BrowserPlaybackState = 'metadata-ready';
    state = reduceBrowserPlaybackState(state, { type: 'loadeddata' });
    expect(state).toBe('loading-data');
    expect(reduceBrowserPlaybackState(state, { type: 'canplay' })).toBe('can-play');
  });

  it('preserves actionable failure state for browser media errors', () => {
    expect(reduceBrowserPlaybackState('loading-data', { type: 'error' })).toBe('error');
    expect(reduceBrowserPlaybackState('can-play', { type: 'stalled' })).toBe('stalled');
    expect(reduceBrowserPlaybackState('stalled', { type: 'waiting' })).toBe('waiting');
  });
});
