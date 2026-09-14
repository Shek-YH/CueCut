export type BrowserPlaybackState = 'idle' | 'loading-metadata' | 'metadata-ready' | 'loading-data' | 'can-play' | 'waiting' | 'stalled' | 'error';

export type BrowserPlaybackEvent =
  | { type: 'source-replaced' }
  | { type: 'loadedmetadata' }
  | { type: 'loadeddata' }
  | { type: 'canplay' }
  | { type: 'waiting' }
  | { type: 'stalled' }
  | { type: 'error' };

export const BROWSER_VIDEO_DECODE_ERROR_MESSAGE = '浏览器无法解码该视频编码';

export function createInitialBrowserPlaybackState(): BrowserPlaybackState {
  return 'idle';
}

export function reduceBrowserPlaybackState(_state: BrowserPlaybackState, event: BrowserPlaybackEvent): BrowserPlaybackState {
  if (event.type === 'source-replaced') return 'loading-metadata';
  if (event.type === 'loadedmetadata') return 'metadata-ready';
  if (event.type === 'loadeddata') return 'loading-data';
  if (event.type === 'canplay') return 'can-play';
  if (event.type === 'waiting') return 'waiting';
  if (event.type === 'stalled') return 'stalled';
  return 'error';
}
