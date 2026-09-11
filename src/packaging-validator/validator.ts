import type { NormalizedRect } from '../packaging-layout/safeArea';

export type PackagingIssueCode = 'timing' | 'edge' | 'overlap' | 'subtitle' | 'typography' | 'visual' | 'runtime';
export interface PackagingValidationIssue { code: PackagingIssueCode; overlayId: string; message: string }
export interface PackagingValidationReport { valid: boolean; issues: PackagingValidationIssue[] }

export interface ValidatableOverlay {
  id: string;
  startSec: number;
  endSec: number;
  rect: NormalizedRect;
  fontSize: number;
  minFontSize: number;
  lineCount: number;
  maxLines: number;
  opacity: number;
  contrast: number;
  seekSafe: boolean;
  runtimeSupported: boolean;
}

function overlaps(left: NormalizedRect, right: NormalizedRect): boolean {
  return left.x < right.x + right.width && left.x + left.width > right.x && left.y < right.y + right.height && left.y + left.height > right.y;
}

export function validatePackagingOverlays(input: { durationSec: number; maxConcurrentOverlays: number; overlays: ValidatableOverlay[]; subtitleRects: NormalizedRect[] }): PackagingValidationReport {
  const issues: PackagingValidationIssue[] = [];
  for (const overlay of input.overlays) {
    if (overlay.startSec < 0 || overlay.endSec <= overlay.startSec || overlay.endSec > input.durationSec) issues.push({ code: 'timing', overlayId: overlay.id, message: 'overlay timing is outside project duration' });
    if (overlay.rect.x < 0 || overlay.rect.y < 0 || overlay.rect.x + overlay.rect.width > 1 || overlay.rect.y + overlay.rect.height > 1) issues.push({ code: 'edge', overlayId: overlay.id, message: 'overlay exceeds normalized canvas bounds' });
    if (input.subtitleRects.some((subtitle) => overlaps(overlay.rect, subtitle))) issues.push({ code: 'subtitle', overlayId: overlay.id, message: 'overlay overlaps subtitle reserved zone' });
    if (overlay.fontSize < overlay.minFontSize || overlay.lineCount > overlay.maxLines) issues.push({ code: 'typography', overlayId: overlay.id, message: 'overlay typography is unreadable or exceeds max lines' });
    if (overlay.opacity <= 0 || overlay.opacity > 1 || overlay.contrast < 0.3) issues.push({ code: 'visual', overlayId: overlay.id, message: 'overlay visual properties are invalid' });
    if (!overlay.seekSafe || !overlay.runtimeSupported) issues.push({ code: 'runtime', overlayId: overlay.id, message: 'overlay runtime is not seek-safe or supported' });
  }
  for (let index = 0; index < input.overlays.length; index += 1) {
    for (let other = index + 1; other < input.overlays.length; other += 1) {
      const left = input.overlays[index]!;
      const right = input.overlays[other]!;
      if (left.startSec < right.endSec && right.startSec < left.endSec && overlaps(left.rect, right.rect)) issues.push({ code: 'overlap', overlayId: right.id, message: `overlay overlaps ${left.id}` });
    }
  }
  return { valid: issues.length === 0, issues };
}

export function repairPackagingOverlays(input: { overlays: Array<Pick<ValidatableOverlay, 'id' | 'rect' | 'fontSize' | 'lineCount' | 'maxLines'>>; subtitleRects: NormalizedRect[] }): { overlays: typeof input.overlays; repairs: Array<{ overlayId: string; action: 'font-size' | 'lift' }> } {
  const repairs: Array<{ overlayId: string; action: 'font-size' | 'lift' }> = [];
  const overlays = input.overlays.map((overlay) => {
    let next = { ...overlay, rect: { ...overlay.rect } };
    if (next.lineCount > next.maxLines) {
      next = { ...next, fontSize: Math.round(next.fontSize * 0.95 * 100) / 100, lineCount: next.maxLines };
      repairs.push({ overlayId: overlay.id, action: 'font-size' });
    }
    if (input.subtitleRects.some((subtitle) => overlaps(next.rect, subtitle))) {
      next = { ...next, rect: { ...next.rect, y: Math.max(0, next.rect.y - 0.15) } };
      repairs.push({ overlayId: overlay.id, action: 'lift' });
    }
    return next;
  });
  return { overlays, repairs };
}
