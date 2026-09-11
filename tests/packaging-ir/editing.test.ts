import { describe, expect, it } from 'vitest';
import { editPackagingPlan, lockPackagingOverlay } from '../../src/packaging-ir/editing';

const plan = {
  schemaVersion: '1.0' as const, projectId: 'p', canvas: { width: 1080, height: 1920, aspectRatio: '9:16', fps: 30 },
  globalStyle: { visualStyle: 'clean-tech', energy: 0.5, density: 'auto' as const, paletteIntent: 'brand', motionIntensity: 0.5 }, timeline: [{ id: 'o', startSec: 1, endSec: 2, intent: 'x', category: 'stat' as const, content: {}, importance: 0.8, visualIntent: { style: 'clean-tech', energy: 0.5, emphasis: 'normal' as const }, motionIntent: { entrance: 'fade_in' as const, emphasis: 'none' as const, exit: 'fade_out' as const }, placementIntent: { preferredZones: ['upper-left' as const], subjectRelation: 'avoid' as const, anchor: 'scene-safe' as const }, constraints: { maxLines: 2, mustRemainReadable: true, mayOverlapSubtitle: false } }],
  constraints: { maxConcurrentOverlays: 2, allowBehindSubject: false, subjectAvoidPadding: 0.1, edgeInsets: { top: 0.04, bottom: 0.08, left: 0.05, right: 0.05 } }, exportHints: { formats: ['mp4' as const], transparent: false },
};

describe('packaging plan edits', () => {
  it('changes theme/aspect and locks overrides without provider access', () => {
    const edited = editPackagingPlan(plan, { visualStyle: 'editorial', aspectRatio: '16:9' });
    expect(edited.globalStyle.visualStyle).toBe('editorial');
    expect(edited.canvas.aspectRatio).toBe('16:9');
    expect(edited.timeline).toEqual(plan.timeline);
    expect(lockPackagingOverlay(edited, 'o', 'upper-right').timeline[0]?.userOverride).toEqual({ locked: true, zone: 'upper-right' });
  });
});
