import { describe, expect, it } from 'vitest';
import { packagingPlanSchema } from '../../src/packaging-ir/schema';

const validPlan = {
  schemaVersion: '1.0',
  projectId: 'project-1',
  canvas: { width: 1080, height: 1920, aspectRatio: '9:16', fps: 30 },
  globalStyle: { visualStyle: 'clean-tech', energy: 0.55, density: 'auto', paletteIntent: 'derive-from-brand', motionIntensity: 0.5 },
  timeline: [{
    id: 'overlay-1', startSec: 3.2, endSec: 7.8, intent: 'highlight_key_claim', category: 'stat',
    content: { text: 'Token 降低 67%', primaryValue: '67%' }, importance: 0.92,
    visualIntent: { style: 'clean-tech', energy: 0.75, emphasis: 'strong' },
    motionIntent: { entrance: 'scale_punch', emphasis: 'scale_pulse', exit: 'fade_out' },
    placementIntent: { preferredZones: ['upper-left', 'upper-right'], subjectRelation: 'avoid', anchor: 'scene-safe' },
    constraints: { maxLines: 2, mustRemainReadable: true, mayOverlapSubtitle: false },
  }],
  constraints: { maxConcurrentOverlays: 2, allowBehindSubject: true, subjectAvoidPadding: 0.1, edgeInsets: { top: 0.04, bottom: 0.08, left: 0.05, right: 0.05 } },
  exportHints: { formats: ['mp4', 'webm-alpha'], transparent: false },
};

describe('Packaging IR schema', () => {
  it('accepts a complete intent-only packaging plan', () => {
    const result = packagingPlanSchema.safeParse(validPlan);
    expect(result.success).toBe(true);
  });

  it('rejects pixel coordinates, arbitrary motions, and invalid time ranges', () => {
    const result = packagingPlanSchema.safeParse({
      ...validPlan,
      timeline: [{ ...validPlan.timeline[0], endSec: 2, motionIntent: { entrance: 'custom_keyframes', emphasis: 'none', exit: 'fade_out' }, placementIntent: { ...validPlan.timeline[0].placementIntent, x: 100 } }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts the SRT repair and chapter/section/visual-unit envelope', () => {
    const result = packagingPlanSchema.safeParse({
      ...validPlan,
      transcriptRepair: {
        segments: [{ id: 's-1', startSec: 0, endSec: 2, originalText: '原始', correctedText: '修正', correctionType: 'asr-recognition', confidence: 0.92, needsReview: false }],
      },
      chapters: [{ id: 'chapter-1', title: '开场', summary: '核心观点', startSec: 0, endSec: 8, sourceSubtitleIds: ['s-1'], semanticRole: 'hook' }],
      sections: [{ id: 'section-1', chapterId: 'chapter-1', title: '金句', summary: '短表达', startSec: 0, endSec: 3, sourceSubtitleIds: ['s-1'], semanticRole: 'quote', evidenceType: 'quote', keepForVisualPackaging: true, visualValue: 0.9, selectionReason: '核心反转', elementIds: ['unit-1'] }],
      visualUnits: [{ id: 'unit-1', sectionId: 'section-1', kind: 'quote', startSec: 0, endSec: 3, layer: 1, persistence: 'transient', sourceSubtitleIds: ['s-1'], summary: '短表达', selectionReason: '核心反转', visualIntent: 'emphasize-contrast', content: { text: '先把需求聊清楚' }, cueTimesSec: [], placement: { preferredZones: ['center'], subjectRelation: 'avoid', anchor: 'scene-safe' }, templateQuery: { semanticRole: 'quote', tags: ['quote'], requiredContentSlots: ['text'] } }],
    });
    expect(result.success).toBe(true);
  });

  it('normalizes numeric schema version and accepts a complete legacy type/elements timeline', () => {
    const result = packagingPlanSchema.safeParse({
      ...validPlan,
      schemaVersion: 1,
      timeline: [{ id: 'legacy-1', type: 'headline', elements: [{ text: '旧格式' }], startSec: 1, endSec: 2 }],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toMatchObject({ schemaVersion: '1.0', timeline: [{ category: 'headline', content: { text: '旧格式' } }] });
  });

  it('rejects unknown template query fields instead of persisting them', () => {
    const result = packagingPlanSchema.safeParse({
      ...validPlan,
      timeline: [{ ...validPlan.timeline[0], templateQuery: {
        semanticRole: 'ordered-process', visualIntent: 'progressive-explanation', tags: ['steps'], requiredContentSlots: ['title', 'items', 'cueTimes'], itemCount: 4,
        durationRangeSec: [8, 60], preferredZones: ['upper-left'], persistence: 'section', safeContext: 'tutorial',
      } }],
    });

    expect(result.success).toBe(false);
  });

  it('accepts and preserves persistence in the strict template query protocol', () => {
    const result = packagingPlanSchema.safeParse({
      ...validPlan,
      timeline: [{ ...validPlan.timeline[0], templateQuery: {
        semanticRole: 'ordered-process', visualIntent: 'progressive-explanation', tags: ['steps'], requiredContentSlots: ['title', 'items', 'cueTimes'], itemCount: 4,
        durationRangeSec: [8, 60], preferredZones: ['upper-left'], persistence: 'section',
      } }],
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.timeline[0]?.templateQuery).toMatchObject({ persistence: 'section' });
  });
});
