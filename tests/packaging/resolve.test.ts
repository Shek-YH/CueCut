import { describe, expect, it } from 'vitest';
import { resolvePackagingPlan } from '../../src/packaging/resolve';

describe('packaging plan resolver', () => {
  it('resolves intent into registry, normalized layout, and runtime timeline', () => {
    const result = resolvePackagingPlan({
      schemaVersion: '1.0', projectId: 'p', canvas: { width: 1080, height: 1920, aspectRatio: '9:16', fps: 30 },
      globalStyle: { visualStyle: 'clean-tech', energy: 0.5, density: 'auto', paletteIntent: 'brand', motionIntensity: 0.5 },
      timeline: [{ id: 'o', startSec: 1, endSec: 3, intent: 'highlight', category: 'stat', content: { value: '67%' }, importance: 0.8, visualIntent: { style: 'clean-tech', energy: 0.5, emphasis: 'strong' }, motionIntent: { entrance: 'scale_punch', emphasis: 'scale_pulse', exit: 'fade_out' }, placementIntent: { preferredZones: ['upper-left'], subjectRelation: 'avoid', anchor: 'scene-safe' }, constraints: { maxLines: 2, mustRemainReadable: true, mayOverlapSubtitle: false } }],
      constraints: { maxConcurrentOverlays: 2, allowBehindSubject: false, subjectAvoidPadding: 0.1, edgeInsets: { top: 0.04, bottom: 0.08, left: 0.05, right: 0.05 } }, exportHints: { formats: ['mp4'], transparent: false },
    });
    expect(result.overlays[0]?.effectId).toMatch(/^cuecut-/);
    expect(result.runtimeTimeline.items[0]?.motion.enter.motionId).toBe('scale_punch');
    expect(result.overlays[0]?.rect.x).toBeGreaterThanOrEqual(0.05);
  });

  it('keeps nearby packaging intents by using deterministic zone fallbacks before dropping them', () => {
    const base = {
      schemaVersion: '1.0' as const, projectId: 'p', canvas: { width: 1080, height: 1920, aspectRatio: '9:16', fps: 30 },
      globalStyle: { visualStyle: 'clean-tech', energy: 0.5, density: 'auto' as const, paletteIntent: 'brand', motionIntensity: 0.5 },
      constraints: { maxConcurrentOverlays: 2, allowBehindSubject: false, subjectAvoidPadding: 0.1, edgeInsets: { top: 0.04, bottom: 0.08, left: 0.05, right: 0.05 } },
      exportHints: { formats: ['mp4' as const], transparent: false },
    };
    const item = (id: string) => ({ id, startSec: 1, endSec: 3, intent: 'highlight', category: 'headline' as const, content: { text: id }, importance: 0.5, visualIntent: { style: 'clean-tech', energy: 0.5, emphasis: 'normal' as const }, motionIntent: { entrance: 'fade_in' as const, emphasis: 'none' as const, exit: 'fade_out' as const }, placementIntent: { preferredZones: ['upper-left' as const], subjectRelation: 'avoid' as const, anchor: 'scene-safe' as const }, constraints: { maxLines: 2, mustRemainReadable: true, mayOverlapSubtitle: false } });

    const result = resolvePackagingPlan({ ...base, timeline: [item('first'), item('second')] });

    expect(result.overlays).toHaveLength(2);
    expect(result.overlays[1]?.rect).not.toEqual(result.overlays[0]?.rect);
    expect(result.diagnostics.dropped).toEqual([]);
  });

  it('reuses the visual main axis for sequential overlays that never coexist', () => {
    const base = {
      schemaVersion: '1.0' as const, projectId: 'p', canvas: { width: 1080, height: 1920, aspectRatio: '9:16', fps: 30 },
      globalStyle: { visualStyle: 'clean-tech', energy: 0.5, density: 'auto' as const, paletteIntent: 'brand', motionIntensity: 0.5 },
      constraints: { maxConcurrentOverlays: 2, allowBehindSubject: false, subjectAvoidPadding: 0.1, edgeInsets: { top: 0.04, bottom: 0.08, left: 0.05, right: 0.05 } },
      exportHints: { formats: ['mp4' as const], transparent: false },
    };
    const item = (id: string, startSec: number, endSec: number) => ({ id, startSec, endSec, intent: 'highlight', category: 'headline' as const, content: { text: id }, importance: 0.5, visualIntent: { style: 'clean-tech', energy: 0.5, emphasis: 'normal' as const }, motionIntent: { entrance: 'fade_in' as const, emphasis: 'none' as const, exit: 'fade_out' as const }, placementIntent: { preferredZones: ['upper-left' as const], subjectRelation: 'avoid' as const, anchor: 'scene-safe' as const }, constraints: { maxLines: 2, mustRemainReadable: true, mayOverlapSubtitle: false } });

    const result = resolvePackagingPlan({ ...base, timeline: [item('first', 1, 2), item('second', 3, 4)] });

    expect(result.overlays[1]?.rect).toEqual(result.overlays[0]?.rect);
  });

  it('keeps chapter and source timing metadata through resolution', () => {
    const base = {
      schemaVersion: '1.0' as const, projectId: 'p', canvas: { width: 1080, height: 1920, aspectRatio: '9:16', fps: 30 },
      globalStyle: { visualStyle: 'clean-tech', energy: 0.5, density: 'auto' as const, paletteIntent: 'brand', motionIntensity: 0.5 },
      constraints: { maxConcurrentOverlays: 2, allowBehindSubject: false, subjectAvoidPadding: 0.1, edgeInsets: { top: 0.04, bottom: 0.08, left: 0.05, right: 0.05 } },
      exportHints: { formats: ['mp4' as const], transparent: false },
    };
    const result = resolvePackagingPlan({ ...base, timeline: [{ id: 'first', chapterId: 'chapter-1', sectionId: 'section-1', sourceSubtitleIds: ['s-1'], sequence: 2, semanticRole: 'evidence', evidenceType: 'number', cadence: { stepMs: 800 }, startSec: 1, endSec: 2, intent: 'show metric', category: 'stat', content: { value: 67 }, importance: 0.8, visualIntent: { style: 'clean-tech', energy: 0.5, emphasis: 'normal' }, motionIntent: { entrance: 'fade_in', emphasis: 'none', exit: 'fade_out' }, placementIntent: { preferredZones: ['upper-left'], subjectRelation: 'avoid', anchor: 'scene-safe' }, constraints: { maxLines: 2, mustRemainReadable: true, mayOverlapSubtitle: false } }] });

    expect(result.runtimeTimeline.items[0]).toMatchObject({ chapterId: 'chapter-1', sectionId: 'section-1', sourceSubtitleIds: ['s-1'], sequence: 2, evidenceType: 'number', cadence: { stepMs: 800 } });
  });

  it('preserves visual metadata and resolves effects only from the local catalog', () => {
    const result = resolvePackagingPlan({
      schemaVersion: '1.0', projectId: 'p', canvas: { width: 1080, height: 1920, aspectRatio: '9:16', fps: 30 },
      globalStyle: { visualStyle: 'clean-tech', energy: 0.5, density: 'auto', paletteIntent: 'brand', motionIntensity: 0.5 },
      timeline: [{ id: 'main', startSec: 1, endSec: 5, intent: 'process', category: 'progress', content: { items: ['一', '二'] }, importance: 0.9, selectionReason: '流程主卡', visualValue: 0.9, layer: 0, persistence: 'section', templateQuery: { semanticRole: 'ordered-process', visualIntent: 'progressive-explanation', tags: ['steps'], requiredContentSlots: ['items'], itemCount: 2, durationRangeSec: [3, 8], preferredZones: ['upper-left'], persistence: 'section' }, visualIntent: { style: 'clean-tech', energy: 0.5, emphasis: 'normal' }, motionIntent: { entrance: 'fade_in', emphasis: 'none', exit: 'fade_out' }, placementIntent: { preferredZones: ['upper-left'], subjectRelation: 'avoid', anchor: 'scene-safe' }, constraints: { maxLines: 2, mustRemainReadable: true, mayOverlapSubtitle: false } }],
      constraints: { maxConcurrentOverlays: 2, allowBehindSubject: false, subjectAvoidPadding: 0.1, edgeInsets: { top: 0.04, bottom: 0.08, left: 0.05, right: 0.05 } }, exportHints: { formats: ['mp4'], transparent: false },
    });
    expect(result.overlays[0]).toMatchObject({ selectionReason: '流程主卡', visualValue: 0.9, layer: 0, persistence: 'section', templateQuery: { tags: ['steps'], persistence: 'section' } });
    expect(result.runtimeTimeline.items[0]).toMatchObject({ selectionReason: '流程主卡', templateQuery: { semanticRole: 'ordered-process', persistence: 'section' }, layer: 0, persistence: 'section' });
    expect(result.runtimeTimeline.items[0]?.selectionScore).toEqual(expect.any(Number));
    expect(result.overlays[0]?.effectId).not.toBe('unknown-ai-template');
  });

  it('keeps parallel main and emphasis overlays when their time ranges overlap', () => {
    const base = { schemaVersion: '1.0' as const, projectId: 'p', canvas: { width: 1080, height: 1920, aspectRatio: '9:16', fps: 30 }, globalStyle: { visualStyle: 'clean-tech', energy: 0.5, density: 'auto' as const, paletteIntent: 'brand', motionIntensity: 0.5 }, constraints: { maxConcurrentOverlays: 3, allowBehindSubject: false, subjectAvoidPadding: 0.1, edgeInsets: { top: 0.04, bottom: 0.08, left: 0.05, right: 0.05 } }, exportHints: { formats: ['mp4' as const], transparent: false } };
    const item = (id: string, layer: number, zone: 'upper-left' | 'center') => ({ id, startSec: 2, endSec: 6, intent: id, category: (layer === 0 ? 'progress' : 'quote') as 'progress' | 'quote', content: { text: id }, importance: 0.9, layer, persistence: layer === 0 ? 'section' as const : 'transient' as const, visualIntent: { style: 'clean-tech', energy: 0.5, emphasis: 'normal' as const }, motionIntent: { entrance: 'fade_in' as const, emphasis: 'none' as const, exit: 'fade_out' as const }, placementIntent: { preferredZones: [zone], subjectRelation: 'avoid' as const, anchor: 'scene-safe' as const }, constraints: { maxLines: 2, mustRemainReadable: true, mayOverlapSubtitle: false } });
    const result = resolvePackagingPlan({ ...base, timeline: [item('main', 0, 'upper-left'), item('emphasis', 1, 'center')] });
    expect(result.overlays.map((overlay) => overlay.id)).toEqual(['main', 'emphasis']);
    expect(result.runtimeTimeline.items).toHaveLength(2);
  });
});
