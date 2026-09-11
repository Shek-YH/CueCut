import { describe, expect, it } from 'vitest';
import { repairPackagingOverlays, validatePackagingOverlays } from '../../src/packaging-validator/validator';

describe('packaging validator', () => {
  it('reports timing, subtitle, typography, and runtime failures without AI', () => {
    const input = {
      durationSec: 10,
      maxConcurrentOverlays: 2,
      subtitleRects: [{ x: 0, y: 0.75, width: 1, height: 0.2 }],
      overlays: [{ id: 'bad', startSec: -1, endSec: 11, rect: { x: 0.8, y: 0.75, width: 0.3, height: 0.2 }, fontSize: 8, minFontSize: 12, lineCount: 3, maxLines: 2, opacity: 1, contrast: 0.8, seekSafe: false, runtimeSupported: false }],
    };
    const report = validatePackagingOverlays(input);
    expect(report.valid).toBe(false);
    expect(report.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining(['timing', 'edge', 'subtitle', 'typography', 'runtime']));
  });

  it('repairs common overflow and subtitle conflicts with bounded rules', () => {
    const result = repairPackagingOverlays({
      overlays: [{ id: 'bad', rect: { x: 0.5, y: 0.8, width: 0.4, height: 0.1 }, fontSize: 20, lineCount: 3, maxLines: 2 }],
      subtitleRects: [{ x: 0, y: 0.75, width: 1, height: 0.2 }],
    });
    expect(result.overlays[0]?.fontSize).toBe(19);
    expect(result.overlays[0]?.lineCount).toBe(2);
    expect(result.overlays[0]?.rect.y).toBeLessThan(0.8);
    expect(result.repairs.length).toBeGreaterThanOrEqual(2);
  });
});
