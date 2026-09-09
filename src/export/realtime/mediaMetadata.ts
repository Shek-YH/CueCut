export interface CapturedMediaMetadata {
  width: number;
  height: number;
  durationMs: number;
  hasAudio: boolean;
  mimeType: string;
}

export function probeCapturedMedia(blob: Blob, documentImpl: Document = document): Promise<CapturedMediaMetadata> {
  if (blob.size <= 0) return Promise.reject(new Error('Captured media is empty'));
  const video = documentImpl.createElement('video');
  const url = URL.createObjectURL(blob);
  video.preload = 'metadata';
  video.muted = true;
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.removeAttribute('src');
      video.load();
    };
    video.onloadedmetadata = () => {
      const metadata = {
        width: video.videoWidth,
        height: video.videoHeight,
        durationMs: video.duration * 1000,
        hasAudio: ((video as HTMLVideoElement & { audioTracks?: { length: number } }).audioTracks?.length ?? 0) > 0,
        mimeType: blob.type,
      };
      cleanup();
      if (!metadata.width || !metadata.height || !Number.isFinite(metadata.durationMs)) reject(new Error('Captured media metadata is incomplete'));
      else resolve(metadata);
    };
    video.onerror = () => {
      cleanup();
      reject(new Error('Captured media could not be decoded'));
    };
    video.src = url;
    video.load();
  });
}
