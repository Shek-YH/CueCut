export interface CaptureMimeSelection {
  mimeType: string;
  container: 'mp4' | 'webm';
  codec: string;
}

const MIME_CANDIDATES: CaptureMimeSelection[] = [
  { mimeType: 'video/webm;codecs=vp9', container: 'webm', codec: 'vp9' },
  { mimeType: 'video/webm;codecs=vp8', container: 'webm', codec: 'vp8' },
  { mimeType: 'video/webm', container: 'webm', codec: 'unknown' },
  { mimeType: 'video/webm;codecs=h264', container: 'webm', codec: 'h264' },
  { mimeType: 'video/mp4;codecs=avc1', container: 'mp4', codec: 'avc1' },
  { mimeType: 'video/mp4', container: 'mp4', codec: 'unknown' },
];

export function selectCaptureMimeType(isTypeSupported: (mimeType: string) => boolean): CaptureMimeSelection {
  const selection = MIME_CANDIDATES.find((candidate) => isTypeSupported(candidate.mimeType));
  if (!selection) throw new Error('MediaRecorder is unsupported for the available capture MIME types');
  return selection;
}

export function captureMimeCandidates(): readonly CaptureMimeSelection[] {
  return MIME_CANDIDATES;
}
