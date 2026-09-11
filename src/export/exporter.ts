export type ExportMode = 'full-video' | 'transparent-mov' | 'transparent-webm';

export interface ExportPlan {
  mode: ExportMode;
  outputExtension: 'mp4' | 'mov' | 'webm';
  renderer: 'unified-render-runtime';
  usesPngSequence: false;
}

export function createExportPlan(input: { mode: ExportMode; durationSec: number }): ExportPlan {
  if (!Number.isFinite(input.durationSec) || input.durationSec <= 0) {
    throw new Error('Export duration must be positive');
  }

  return {
    mode: input.mode,
    outputExtension: input.mode === 'transparent-mov' ? 'mov' : input.mode === 'transparent-webm' ? 'webm' : 'mp4',
    renderer: 'unified-render-runtime',
    usesPngSequence: false,
  };
}
