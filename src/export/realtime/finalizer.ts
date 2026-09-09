import type { RealtimeCaptureResult } from './types';

function safeStem(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^\.+|\.+$/g, '') || 'CueCut';
}

export function createRealtimeCaptureFileName(projectName: string, timestampMs: number, container: 'mp4' | 'webm'): string {
  return `${safeStem(projectName)}_Chroma_${new Date(timestampMs).toISOString().replace(/[:.]/g, '-')}.${container}`;
}

export function createRealtimeCaptureDownload(result: RealtimeCaptureResult, documentImpl: Document = document): void {
  if (!result.validation.ok) throw new Error(`Cannot download invalid capture: ${result.validation.errors.join(', ')}`);
  const url = URL.createObjectURL(result.blob);
  const link = documentImpl.createElement('a');
  link.href = url;
  link.download = result.fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
