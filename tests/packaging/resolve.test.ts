import { describe, expect, it } from 'vitest';
import { findPackMotion } from '../../src/motions/packCatalog';
import { createFixtureProject } from '../../src/project/fixtures';
import { applyResolvedPackagingToProject } from '../../src/packaging/apply';
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
    const item = (id: string, layer: number, zone: 'upper-left' | 'center') => ({ id, startSec: 2, endSec: 6, intent: id, category: (layer === 0 ? 'progress' : 'quote') as 'progress' | 'quote', content: { items: [id] }, importance: 0.9, layer, persistence: layer === 0 ? 'section' as const : 'transient' as const, visualIntent: { style: 'clean-tech', energy: 0.5, emphasis: 'normal' as const }, motionIntent: { entrance: 'fade_in' as const, emphasis: 'none' as const, exit: 'fade_out' as const }, placementIntent: { preferredZones: [zone], subjectRelation: 'avoid' as const, anchor: 'scene-safe' as const }, constraints: { maxLines: 2, mustRemainReadable: true, mayOverlapSubtitle: false } });
    const result = resolvePackagingPlan({ ...base, timeline: [item('main', 0, 'upper-left'), item('emphasis', 1, 'center')] });
    expect(result.overlays.map((overlay) => overlay.id)).toEqual(['main', 'emphasis']);
    expect(result.runtimeTimeline.items).toHaveLength(2);
  });

  it('uses supplied subtitle and subject rects for spatial collision resolution', () => {
    const plan = {
      schemaVersion: '1.0' as const, projectId: 'p', canvas: { width: 1080, height: 1920, aspectRatio: '9:16', fps: 30 },
      globalStyle: { visualStyle: 'clean-tech', energy: 0.5, density: 'auto' as const, paletteIntent: 'brand', motionIntensity: 0.5 },
      timeline: [{ id: 'spatial', startSec: 1, endSec: 3, intent: 'highlight', category: 'headline' as const, content: { text: '空间测试' }, importance: 0.9, visualIntent: { style: 'clean-tech', energy: 0.5, emphasis: 'normal' as const }, motionIntent: { entrance: 'fade_in' as const, emphasis: 'none' as const, exit: 'fade_out' as const }, placementIntent: { preferredZones: ['upper-left' as const], subjectRelation: 'avoid' as const, anchor: 'scene-safe' as const }, constraints: { maxLines: 2, mustRemainReadable: true, mayOverlapSubtitle: false } }],
      constraints: { maxConcurrentOverlays: 2, allowBehindSubject: false, subjectAvoidPadding: 0, edgeInsets: { top: 0.04, bottom: 0.08, left: 0.05, right: 0.05 } }, exportHints: { formats: ['mp4' as const], transparent: false },
    };

    const result = resolvePackagingPlan(plan, {
      subtitleRects: [{ x: 0.04, y: 0.03, width: 0.4, height: 0.2 }],
      subjectRects: [{ x: 0.04, y: 0.03, width: 0.4, height: 0.2 }],
    });

    expect(result.overlays[0]?.rect).not.toEqual({ x: 0.05, y: 0.04, width: 0.36, height: 0.12 });
    expect(result.diagnostics.collisionRepairs).toBeGreaterThan(0);
  });

  it('expands subject collision rects by padding and only behind cards may bypass the subject', () => {
    const base = {
      schemaVersion: '1.0' as const, projectId: 'p', canvas: { width: 1080, height: 1920, aspectRatio: '9:16', fps: 30 },
      globalStyle: { visualStyle: 'clean-tech', energy: 0.5, density: 'auto' as const, paletteIntent: 'brand', motionIntensity: 0.5 },
      timeline: [{ id: 'padding', startSec: 1, endSec: 3, intent: 'highlight', category: 'headline' as const, content: { text: 'padding' }, importance: 0.9, visualIntent: { style: 'clean-tech', energy: 0.5, emphasis: 'normal' as const }, motionIntent: { entrance: 'fade_in' as const, emphasis: 'none' as const, exit: 'fade_out' as const }, placementIntent: { preferredZones: ['upper-left' as const], subjectRelation: 'avoid' as const, anchor: 'scene-safe' as const }, constraints: { maxLines: 2, mustRemainReadable: true, mayOverlapSubtitle: false } }],
      constraints: { maxConcurrentOverlays: 2, allowBehindSubject: false, subjectAvoidPadding: 0.02, edgeInsets: { top: 0.04, bottom: 0.08, left: 0.05, right: 0.05 } }, exportHints: { formats: ['mp4' as const], transparent: false },
    };
    const subjectRects = [{ x: 0.42, y: 0.04, width: 0.1, height: 0.12 }];

    const blocked = resolvePackagingPlan(base, { subjectRects });
    const behindPlan = { ...base, timeline: [{ ...base.timeline[0], placementIntent: { ...base.timeline[0].placementIntent, subjectRelation: 'behind' as const } }], constraints: { ...base.constraints, allowBehindSubject: true } };
    const allowedBehind = resolvePackagingPlan(behindPlan, { subjectRects: [{ x: 0.05, y: 0.04, width: 0.36, height: 0.12 }] });
    const allowedAvoid = resolvePackagingPlan({ ...base, constraints: { ...base.constraints, allowBehindSubject: true } }, { subjectRects: [{ x: 0.05, y: 0.04, width: 0.36, height: 0.12 }] });

    expect(blocked.overlays[0]?.rect).not.toEqual({ x: 0.05, y: 0.04, width: 0.36, height: 0.12 });
    expect(allowedBehind.overlays[0]?.rect).toEqual({ x: 0.05, y: 0.04, width: 0.36, height: 0.12 });
    expect(allowedAvoid.overlays[0]?.rect).not.toEqual({ x: 0.05, y: 0.04, width: 0.36, height: 0.12 });
  });

  it('drops avoid and foreground cards when every candidate collides with the subject, even if behind is allowed', () => {
    const base = {
      schemaVersion: '1.0' as const, projectId: 'p', canvas: { width: 1080, height: 1920, aspectRatio: '9:16', fps: 30 },
      globalStyle: { visualStyle: 'clean-tech', energy: 0.5, density: 'auto' as const, paletteIntent: 'brand', motionIntensity: 0.5 },
      constraints: { maxConcurrentOverlays: 2, allowBehindSubject: true, subjectAvoidPadding: 0, edgeInsets: { top: 0.04, bottom: 0.08, left: 0.05, right: 0.05 } }, exportHints: { formats: ['mp4' as const], transparent: false },
    };
    const item = (id: string, subjectRelation: 'avoid' | 'foreground') => ({ id, startSec: 1, endSec: 4, intent: id, category: 'progress' as const, content: { items: [id] }, importance: 0.9, visualIntent: { style: 'clean-tech', energy: 0.5, emphasis: 'normal' as const }, motionIntent: { entrance: 'fade_in' as const, emphasis: 'none' as const, exit: 'fade_out' as const }, placementIntent: { preferredZones: ['upper-left' as const], subjectRelation, anchor: 'scene-safe' as const }, constraints: { maxLines: 2, mustRemainReadable: true, mayOverlapSubtitle: false } });

    const result = resolvePackagingPlan({ ...base, timeline: [item('avoid', 'avoid'), item('foreground', 'foreground')] }, { subjectRects: [{ x: 0, y: 0, width: 1, height: 1 }] });

    expect(result.overlays.map((overlay) => overlay.id)).toEqual(['foreground']);
    expect(result.diagnostics.dropped).toEqual(['avoid']);
    expect(result.diagnostics.warnings).toEqual(['fixed collision prevented overlay avoid from placement']);
  });

  it('keeps the most important concurrent overlays and reports deterministic drops', () => {
    const base = {
      schemaVersion: '1.0' as const, projectId: 'p', canvas: { width: 1080, height: 1920, aspectRatio: '9:16', fps: 30 },
      globalStyle: { visualStyle: 'clean-tech', energy: 0.5, density: 'auto' as const, paletteIntent: 'brand', motionIntensity: 0.5 },
      constraints: { maxConcurrentOverlays: 1, allowBehindSubject: false, subjectAvoidPadding: 0, edgeInsets: { top: 0.04, bottom: 0.08, left: 0.05, right: 0.05 } }, exportHints: { formats: ['mp4' as const], transparent: false },
    };
    const item = (id: string, importance: number) => ({ id, startSec: 1, endSec: 4, intent: id, category: 'progress' as const, content: { items: [id] }, importance, visualIntent: { style: 'clean-tech', energy: 0.5, emphasis: 'normal' as const }, motionIntent: { entrance: 'fade_in' as const, emphasis: 'none' as const, exit: 'fade_out' as const }, placementIntent: { preferredZones: ['upper-left' as const], subjectRelation: 'avoid' as const, anchor: 'scene-safe' as const }, constraints: { maxLines: 2, mustRemainReadable: true, mayOverlapSubtitle: false } });

    const result = resolvePackagingPlan({ ...base, timeline: [item('low', 0.2), item('high', 0.9)] });

    expect(result.overlays.map((overlay) => overlay.id)).toEqual(['high']);
    expect(result.diagnostics.dropped).toEqual(['low']);
    expect(result.diagnostics.repairs).toEqual(expect.arrayContaining([{ overlayId: 'low', action: 'drop' }]));
  });

  it('retains protected overlays above the hard concurrency limit and reports a warning', () => {
    const base = {
      schemaVersion: '1.0' as const, projectId: 'p', canvas: { width: 1080, height: 1920, aspectRatio: '9:16', fps: 30 },
      globalStyle: { visualStyle: 'clean-tech', energy: 0.5, density: 'auto' as const, paletteIntent: 'brand', motionIntensity: 0.5 },
      constraints: { maxConcurrentOverlays: 1, allowBehindSubject: false, subjectAvoidPadding: 0, edgeInsets: { top: 0.04, bottom: 0.08, left: 0.05, right: 0.05 } }, exportHints: { formats: ['mp4' as const], transparent: false },
    };
    const item = (id: string, locked: boolean) => ({ id, startSec: 1, endSec: 4, intent: id, category: 'progress' as const, content: { items: [id] }, importance: 0.9, userOverride: { locked }, visualIntent: { style: 'clean-tech', energy: 0.5, emphasis: 'normal' as const }, motionIntent: { entrance: 'fade_in' as const, emphasis: 'none' as const, exit: 'fade_out' as const }, placementIntent: { preferredZones: ['upper-left' as const], subjectRelation: 'avoid' as const, anchor: 'scene-safe' as const }, constraints: { maxLines: 2, mustRemainReadable: true, mayOverlapSubtitle: false } });

    const result = resolvePackagingPlan({ ...base, timeline: [item('locked', true), item('important', false)] });

    expect(result.overlays.map((overlay) => overlay.id)).toEqual(['locked', 'important']);
    expect(result.diagnostics.dropped).toEqual([]);
    expect(result.diagnostics.warnings).toEqual(['maxConcurrentOverlays exceeded by protected overlay important']);
  });

  it('uses and preserves a locked user override zone instead of the AI preferred zone', () => {
    const result = resolvePackagingPlan({
      schemaVersion: '1.0', projectId: 'p', canvas: { width: 1080, height: 1920, aspectRatio: '9:16', fps: 30 },
      globalStyle: { visualStyle: 'clean-tech', energy: 0.5, density: 'auto', paletteIntent: 'brand', motionIntensity: 0.5 },
      timeline: [{ id: 'locked-zone', startSec: 1, endSec: 3, intent: 'highlight', category: 'headline', content: { text: 'locked' }, importance: 0.9, userOverride: { locked: true, zone: 'lower-right' }, visualIntent: { style: 'clean-tech', energy: 0.5, emphasis: 'normal' }, motionIntent: { entrance: 'fade_in', emphasis: 'none', exit: 'fade_out' }, placementIntent: { preferredZones: ['upper-left'], subjectRelation: 'avoid', anchor: 'scene-safe' }, constraints: { maxLines: 2, mustRemainReadable: true, mayOverlapSubtitle: false } }],
      constraints: { maxConcurrentOverlays: 2, allowBehindSubject: false, subjectAvoidPadding: 0, edgeInsets: { top: 0.04, bottom: 0.08, left: 0.05, right: 0.05 } }, exportHints: { formats: ['mp4'], transparent: false },
    });

    expect(result.overlays[0]).toMatchObject({ rect: { x: 0.59, y: 0.8, width: 0.36, height: 0.12 }, locked: true, userOverride: { locked: true, zone: 'lower-right' } });
    expect(result.runtimeTimeline.items[0]).toMatchObject({ locked: true, userOverride: { locked: true, zone: 'lower-right' } });
  });

  it('keeps a locked zone in place during overlay collision and reports the warning', () => {
    const item = (id: string, locked: boolean) => ({ id, startSec: 1, endSec: 3, intent: id, category: 'headline' as const, content: { text: id }, importance: 0.9, userOverride: { locked, zone: 'upper-left' as const }, visualIntent: { style: 'clean-tech', energy: 0.5, emphasis: 'normal' as const }, motionIntent: { entrance: 'fade_in' as const, emphasis: 'none' as const, exit: 'fade_out' as const }, placementIntent: { preferredZones: ['upper-left' as const], subjectRelation: 'avoid' as const, anchor: 'scene-safe' as const }, constraints: { maxLines: 2, mustRemainReadable: true, mayOverlapSubtitle: false } });
    const result = resolvePackagingPlan({
      schemaVersion: '1.0', projectId: 'p', canvas: { width: 1080, height: 1920, aspectRatio: '9:16', fps: 30 }, globalStyle: { visualStyle: 'clean-tech', energy: 0.5, density: 'auto', paletteIntent: 'brand', motionIntensity: 0.5 }, timeline: [item('first', false), item('locked', true)], constraints: { maxConcurrentOverlays: 2, allowBehindSubject: false, subjectAvoidPadding: 0, edgeInsets: { top: 0.04, bottom: 0.08, left: 0.05, right: 0.05 } }, exportHints: { formats: ['mp4'], transparent: false },
    });

    expect(result.overlays.find((overlay) => overlay.id === 'locked')).toMatchObject({ rect: { x: 0.05, y: 0.04, width: 0.36, height: 0.12 }, locked: true });
    expect(result.diagnostics.warnings).toContain('locked overlay locked retained despite overlay collision');
  });

  it('round-trips real resolver effects and metadata through apply into composition', () => {
    const result = resolvePackagingPlan({
      schemaVersion: '1.0', projectId: 'fixture', canvas: { width: 1920, height: 1080, aspectRatio: '16:9', fps: 30 },
      globalStyle: { visualStyle: 'clean-tech', energy: 0.5, density: 'auto', paletteIntent: 'brand', motionIntensity: 0.5 },
      timeline: [{ id: 'round-trip', chapterId: 'chapter-1', sectionId: 'section-1', sourceSubtitleIds: ['subtitle-1'], semanticRole: 'quote', selectionReason: '核心反转', visualValue: 0.88, layer: 1, persistence: 'section', userOverride: { locked: true }, cadence: { stepMs: 500, cueOffsetsMs: [0] }, startSec: 1, endSec: 4, intent: 'quote', category: 'quote', content: { text: '短句' }, importance: 0.9, templateQuery: { semanticRole: 'quote', tags: ['quote'], persistence: 'section' }, visualIntent: { style: 'clean-tech', energy: 0.5, emphasis: 'strong' }, motionIntent: { entrance: 'fade_in', emphasis: 'none', exit: 'fade_out' }, placementIntent: { preferredZones: ['center'], subjectRelation: 'avoid', anchor: 'scene-safe' }, constraints: { maxLines: 2, mustRemainReadable: true, mayOverlapSubtitle: false } }],
      constraints: { maxConcurrentOverlays: 2, allowBehindSubject: false, subjectAvoidPadding: 0.1, edgeInsets: { top: 0.04, bottom: 0.08, left: 0.05, right: 0.05 } }, exportHints: { formats: ['mp4'], transparent: false },
    });
    const applied = applyResolvedPackagingToProject(createFixtureProject(), result);
    const segment = applied.segments.find((candidate) => candidate.segmentId === 'packaging-round-trip');

    expect(result.overlays).toHaveLength(1);
    expect(result.overlays.every((overlay) => findPackMotion(overlay.effectId))).toBe(true);
    expect(segment).toMatchObject({ chapterId: 'chapter-1', sectionId: 'section-1', sourceSubtitleIds: ['subtitle-1'], selectionReason: '核心反转', visualValue: 0.88, layer: 1, locked: true, persistence: 'section', templateQuery: { semanticRole: 'quote', persistence: 'section' }, cadence: { stepMs: 500, cueOffsetsMs: [0] } });
  });
});
