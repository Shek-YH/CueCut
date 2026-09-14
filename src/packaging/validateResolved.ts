import { validatePackagingOverlays, type PackagingValidationReport } from '../packaging-validator/validator';
import type { ResolvedPackagingOverlay } from './resolve';

export function validateResolvedPackagingPlan(input: { durationSec: number; maxConcurrentOverlays: number; overlays: Array<Pick<ResolvedPackagingOverlay, 'id' | 'startSec' | 'endSec' | 'rect' | 'content' | 'importance'>>; subtitleRects?: Array<{ x: number; y: number; width: number; height: number }> }): PackagingValidationReport {
  return validatePackagingOverlays({
    durationSec: input.durationSec,
    maxConcurrentOverlays: input.maxConcurrentOverlays,
    subtitleRects: input.subtitleRects ?? [],
    overlays: input.overlays.map((overlay) => ({
      id: overlay.id,
      startSec: overlay.startSec,
      endSec: overlay.endSec,
      rect: overlay.rect,
      fontSize: 36,
      minFontSize: 14,
      lineCount: Array.isArray(overlay.content.items) ? overlay.content.items.length : 1,
      maxLines: 8,
      opacity: 1,
      contrast: 1,
      seekSafe: true,
      runtimeSupported: true,
    })),
  });
}
