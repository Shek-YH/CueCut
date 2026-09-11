import { describe, expect, it } from 'vitest';
import { createPackagingDirector } from '../../src/packaging-ai/service';

const plan = {
  schemaVersion: '1.0' as const,
  projectId: 'project-1',
  canvas: { width: 1080, height: 1920, aspectRatio: '9:16', fps: 30 },
  globalStyle: { visualStyle: 'clean-tech', energy: 0.5, density: 'auto' as const, paletteIntent: 'brand', motionIntensity: 0.5 },
  timeline: [],
  constraints: { maxConcurrentOverlays: 2, allowBehindSubject: false, subjectAvoidPadding: 0.1, edgeInsets: { top: 0.04, bottom: 0.08, left: 0.05, right: 0.05 } },
  exportHints: { formats: ['mp4' as const], transparent: false },
};

describe('single-pass packaging director', () => {
  it('calls the provider once and validates the returned Packaging IR', async () => {
    let calls = 0;
    const director = createPackagingDirector(async () => { calls += 1; return plan; });
    const result = await director.generate({ transcript: [] });
    expect(result.plan).toEqual(plan);
    expect(result.aiCallCount).toBe(1);
    expect(calls).toBe(1);
  });

  it('does not retry the provider when local JSON repair cannot produce valid IR', async () => {
    let calls = 0;
    const director = createPackagingDirector(async () => { calls += 1; return '{not-json'; });
    await expect(director.generate({ transcript: [] })).rejects.toThrow();
    expect(calls).toBe(1);
  });

  it('repairs the legacy type/elements timeline shape into Packaging IR locally', async () => {
    const director = createPackagingDirector(async () => JSON.stringify({
      schemaVersion: 1,
      timeline: [{ type: 'headline', elements: [{ text: '核心数据 67%' }], startSec: 2, endSec: 4 }],
    }));
    const result = await director.generate({ project: { projectId: 'legacy-project', durationSec: 10, fps: 30, canvasWidth: 1080, canvasHeight: 1920, aspectRatio: '9:16' }, preferences: { style: 'clean-tech', density: 'auto' } });
    expect(result.repaired).toBe(true);
    expect(result.plan.schemaVersion).toBe('1.0');
    expect(result.plan.projectId).toBe('legacy-project');
    expect(result.plan.timeline[0]?.category).toBe('headline');
    expect(result.plan.timeline[0]?.content.text).toContain('67%');
  });

  it('normalizes the chapter and section response requested by the director prompt', async () => {
    const director = createPackagingDirector(async () => ({
      schemaVersion: 1,
      chapters: [{ id: 'chapter-1', title: '核心观点', startSec: 0.2, endSec: 8 }],
      sections: [{
        id: 'section-1', chapterId: 'chapter-1', startSec: 0.2, endSec: 4.5,
        semanticRole: 'hook', evidenceType: 'quote',
        elements: [{ id: 'element-1', startSec: 0.2, endSec: 3.2, category: 'quote', content: { text: '先把需求聊清楚' }, sequence: 1, placementIntent: { preferredZones: ['center'], subjectRelation: 'avoid', anchor: 'scene-safe' }, motionIntent: { entrance: 'scale_punch', emphasis: 'glow', exit: 'fade_out' }, visualIntent: { style: 'clean-tech', energy: 0.8, emphasis: 'strong' } }],
      }],
    }));

    const result = await director.generate({ project: { projectId: 'chapter-project', durationSec: 10, fps: 30, canvasWidth: 1080, canvasHeight: 1920, aspectRatio: '9:16' }, analysis: { transcript: [{ id: 's-1', startSec: 0.2, endSec: 3.2, text: '先把需求聊清楚再开始制作' }] }, preferences: { style: 'clean-tech', density: 'auto' } });

    expect(result.repaired).toBe(true);
    expect(result.plan.schemaVersion).toBe('1.0');
    expect(result.plan.timeline[0]).toMatchObject({ chapterId: 'chapter-1', sectionId: 'section-1', sequence: 1, semanticRole: 'hook', evidenceType: 'quote', sourceSubtitleIds: ['s-1'], content: { text: '先把需求聊清楚' }, placementIntent: { preferredZones: ['center'] }, motionIntent: { entrance: 'scale_punch', emphasis: 'glow' }, visualIntent: { energy: 0.8, emphasis: 'strong' } });
  });

  it('assigns semantic defaults when an AI section omits layout details', async () => {
    const director = createPackagingDirector(async () => ({
      schemaVersion: '1.0',
      chapters: [],
      sections: [{ id: 'section-steps', startSec: 20, endSec: 145, semanticRole: 'ordered-process', evidenceType: 'process', elements: [{ id: 'steps', startSec: 24, endSec: 145, category: 'progress', content: { items: ['先看论证', '找反常识', '排阅读顺序', '亲自阅读'] }, cadence: { cueOffsetsMs: [0, 26000, 86000, 103000] } }] }],
    }));

    const result = await director.generate({ project: { projectId: 'steps-project', durationSec: 222.1, fps: 30, canvasWidth: 1080, canvasHeight: 1920, aspectRatio: '9:16' }, preferences: { style: 'clean-tech', density: 'auto' } });

    expect(result.plan.timeline[0]).toMatchObject({ semanticRole: 'ordered-process', evidenceType: 'process', placementIntent: { preferredZones: ['upper-left', 'upper-right'] }, cadence: { cueOffsetsMs: [0, 26000, 86000, 103000] } });
  });

  it('preserves transcript repair and the full visual packaging envelope', async () => {
    const director = createPackagingDirector(async () => ({
      schemaVersion: 1,
      transcriptRepair: { segments: [{ id: 's-1', startSec: 0, endSec: 2, originalText: '原始错词', correctedText: '修正词', correctionType: 'proper-noun', confidence: 0.88, needsReview: true }] },
      chapters: [{ id: 'chapter-1', title: '开场', summary: '观点', startSec: 0, endSec: 6, sourceSubtitleIds: ['s-1'], semanticRole: 'hook' }],
      sections: [{ id: 'section-1', chapterId: 'chapter-1', title: '观点', summary: '提炼', startSec: 0, endSec: 6, sourceSubtitleIds: ['s-1'], semanticRole: 'hook', evidenceType: 'quote', keepForVisualPackaging: true, visualValue: 0.9, selectionReason: '核心观点', elementIds: ['unit-1'] }],
      visualUnits: [{ id: 'unit-1', sectionId: 'section-1', kind: 'quote', startSec: 0, endSec: 3, layer: 1, persistence: 'transient', sourceSubtitleIds: ['s-1'], summary: '短句', selectionReason: '核心观点', visualIntent: 'emphasize-contrast', content: { text: '一句短话' }, cueTimesSec: [], placement: { preferredZones: ['center'], subjectRelation: 'avoid', anchor: 'scene-safe' }, templateQuery: { semanticRole: 'quote', tags: ['quote'], requiredContentSlots: ['text'] } }],
    }));
    const result = await director.generate({ project: { projectId: 'envelope-project', durationSec: 10, fps: 30, canvasWidth: 1080, canvasHeight: 1920, aspectRatio: '9:16' }, analysis: { transcript: [{ id: 's-1', startSec: 0, endSec: 2, text: '原始错词' }] }, preferences: { style: 'clean-tech', density: 'auto' } });
    expect(result.plan.transcriptRepair?.segments[0]).toMatchObject({ originalText: '原始错词', correctedText: '修正词', confidence: 0.88, needsReview: true });
    expect(result.plan.chapters?.[0]).toMatchObject({ id: 'chapter-1', semanticRole: 'hook' });
    expect(result.plan.visualUnits?.[0]).toMatchObject({ selectionReason: '核心观点', layer: 1, persistence: 'transient', templateQuery: { tags: ['quote'] } });
    expect(result.plan.timeline[0]).toMatchObject({ sectionId: 'section-1', selectionReason: '核心观点', visualValue: 0.9, layer: 1, persistence: 'transient', templateQuery: { semanticRole: 'quote' } });
  });

  it('skips false and low-value visual units while keeping valuable units executable', async () => {
    const director = createPackagingDirector(async () => ({
      schemaVersion: '1.0',
      visualUnits: [
        { id: 'skip-false', sectionId: 's', kind: 'callout', startSec: 1, endSec: 2, layer: 1, persistence: 'transient', visualValue: false, keepForVisualPackaging: false, content: { text: '废话' } },
        { id: 'skip-low', sectionId: 's', kind: 'callout', startSec: 2, endSec: 3, layer: 1, persistence: 'transient', visualValue: 0.1, content: { text: '重复' } },
        { id: 'keep', sectionId: 's', kind: 'callout', startSec: 3, endSec: 4, layer: 1, persistence: 'transient', visualValue: 0.9, selectionReason: '新信息', content: { text: '重点' } },
      ],
    }));
    const result = await director.generate({ project: { projectId: 'value-project', durationSec: 10, fps: 30, canvasWidth: 1080, canvasHeight: 1920, aspectRatio: '9:16' }, preferences: { style: 'clean-tech', density: 'auto' } });
    expect(result.plan.timeline.map((item) => item.id)).toEqual(['keep']);
    expect(result.plan.visualUnits?.map((unit) => unit.id)).toEqual(['keep']);
  });

  it('skips a visual unit explicitly excluded from visual packaging', async () => {
    const director = createPackagingDirector(async () => ({
      schemaVersion: '1.0',
      visualUnits: [{
        id: 'excluded', sectionId: 'section-1', kind: 'quote', startSec: 1, endSec: 3,
        layer: 1, persistence: 'transient', visualValue: 1, keepForVisualPackaging: false,
        sourceSubtitleIds: [], summary: '重复说明', selectionReason: '已由主卡表达',
        visualIntent: 'emphasize-key-claim', content: { text: '重复说明' }, cueTimesSec: [],
        placement: { preferredZones: ['center'], subjectRelation: 'avoid', anchor: 'scene-safe' },
        templateQuery: { semanticRole: 'quote', requiredContentSlots: ['text'] },
      }],
    }));

    const result = await director.generate({
      project: { projectId: 'excluded-project', durationSec: 10, fps: 30, canvasWidth: 1080, canvasHeight: 1920, aspectRatio: '9:16' },
      analysis: { transcript: [{ id: 's-1', startSec: 1, endSec: 3, text: '重复说明' }] },
      preferences: { style: 'clean-tech', density: 'auto' },
    });

    expect(result.plan.timeline).toEqual([]);
  });

  it('does not reset explicit motion, placement, cadence, or template parameters', async () => {
    const director = createPackagingDirector(async () => ({
      schemaVersion: '1.0',
      timeline: [{ id: 'explicit', startSec: 1, endSec: 4, category: 'quote', content: { text: '短句' }, importance: 0.9, selectionReason: '反转', visualValue: 0.95, layer: 2, persistence: 'section', templateQuery: { semanticRole: 'quote', tags: ['large-type'] }, cadence: { cueOffsetsMs: [0, 800] }, visualIntent: { style: 'editorial', energy: 0.9, emphasis: 'strong' }, motionIntent: { entrance: 'slam', emphasis: 'glow', exit: 'scale_out' }, placementIntent: { preferredZones: ['mid-right'], subjectRelation: 'foreground', anchor: 'canvas' }, constraints: { maxLines: 3, mustRemainReadable: true, mayOverlapSubtitle: true } }],
    }));
    const result = await director.generate({ project: { projectId: 'explicit-project', durationSec: 10, fps: 30, canvasWidth: 1080, canvasHeight: 1920, aspectRatio: '9:16' }, preferences: { style: 'clean-tech', density: 'auto' } });
    expect(result.plan.timeline[0]).toMatchObject({ selectionReason: '反转', visualValue: 0.95, layer: 2, persistence: 'section', templateQuery: { tags: ['large-type'] }, placementIntent: { preferredZones: ['mid-right'], subjectRelation: 'foreground', anchor: 'canvas' }, motionIntent: { entrance: 'slam', emphasis: 'glow', exit: 'scale_out' } });
  });
});
