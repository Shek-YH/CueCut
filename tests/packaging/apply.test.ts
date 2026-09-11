import { describe, expect, it } from 'vitest';
import { createFixtureProject } from '../../src/project/fixtures';
import { applyResolvedPackagingToProject } from '../../src/packaging/apply';

describe('apply resolved packaging to project', () => {
  it('writes resolved overlays into canonical effects for Layers and Timeline', () => {
    const project = createFixtureProject();
    project.effects = [];
    const next = applyResolvedPackagingToProject(project, {
      overlays: [{
        id: 'overlay-1', effectId: 'cuecut-ring-metric', startSec: 1, endSec: 3,
        rect: { x: 0.1, y: 0.2, width: 0.36, height: 0.12 }, content: { value: '67%', text: 'Token 67%' },
        motion: { entrance: 'scale_punch', emphasis: 'scale_pulse', exit: 'fade_out' }, seed: 1, locked: true,
        candidates: [], importance: 0.8,
      }],
    });

    expect(next.effects).toHaveLength(1);
    expect(next.effects[0]).toMatchObject({
      effectId: 'packaging-overlay-1',
      familyId: 'pack-0-2-percentage',
      variantId: 'pack:cuecut-ring-metric',
      time: { startSec: 1, endSec: 3 },
      layout: { nx: 0.1, ny: 0.2, nw: 0.36, nh: 0.12 },
      userFlags: { locked: true, manual: false },
    });
  });

  it('uses overlapping transcript text when the plan only contains a generic placeholder', () => {
    const project = createFixtureProject();
    project.effects = [];
    project.subtitles = [{ id: 's-1', startSec: 1, endSec: 2.5, text: '真实字幕内容' }];
    const next = applyResolvedPackagingToProject(project, {
      overlays: [{
        id: 'overlay-1', effectId: 'cuecut-alert-card', startSec: 1, endSec: 3,
        rect: { x: 0.1, y: 0.2, width: 0.36, height: 0.12 }, content: { headline: '包装重点' },
        motion: { entrance: 'fade_in', emphasis: 'none', exit: 'fade_out' }, seed: 1,
        candidates: [], importance: 0.5,
      }],
    });

    expect(next.effects[0]?.content).toMatchObject({ headline: '真实字幕内容', text: '真实字幕内容' });
  });

  it('does not leak object stringification into list-style pack content', () => {
    const project = createFixtureProject();
    project.effects = [];
    project.subtitles = [{ id: 's-1', startSec: 1, endSec: 2.5, text: '步骤一的真实字幕' }];
    const next = applyResolvedPackagingToProject(project, {
      overlays: [{
        id: 'overlay-1', effectId: 'cuecut-versus-card', startSec: 1, endSec: 3,
        rect: { x: 0.1, y: 0.2, width: 0.36, height: 0.12 }, content: { items: [{ type: 'before' }, { type: 'after' }] },
        motion: { entrance: 'fade_in', emphasis: 'none', exit: 'fade_out' }, seed: 1,
        candidates: [], importance: 0.5,
      }],
    });

    expect(next.effects[0]?.content.items).toEqual(['步骤一的真实字幕']);
  });

  it('materializes list cadence as subtitle-aligned cue times for progressive cards', () => {
    const project = createFixtureProject();
    project.project.durationSec = 222.1;
    project.effects = [];
    const next = applyResolvedPackagingToProject(project, {
      overlays: [{
        id: 'overlay-steps', effectId: 'cuecut-step-timeline', startSec: 24, endSec: 145,
        rect: { x: 0.05, y: 0.12, width: 0.36, height: 0.42 },
        content: { items: ['先看论证', '找反常识', '排阅读顺序', '亲自阅读'] },
        cadence: { cueOffsetsMs: [0, 26000, 86000, 103000] },
        motion: { entrance: 'fade_in', emphasis: 'none', exit: 'fade_out' }, seed: 1,
        candidates: [], importance: 0.9,
      }],
    });

    expect(next.effects[0]?.content.items).toEqual([
      { text: '先看论证', cue: { startSec: 24 } },
      { text: '找反常识', cue: { startSec: 50 } },
      { text: '排阅读顺序', cue: { startSec: 110 } },
      { text: '亲自阅读', cue: { startSec: 127 } },
    ]);
  });

  it('converts absolute cueTimesSec into progressive cue.startSec values', () => {
    const project = createFixtureProject();
    project.project.durationSec = 20;
    project.effects = [];
    const next = applyResolvedPackagingToProject(project, {
      overlays: [{ id: 'overlay-steps', effectId: 'cuecut-step-timeline', startSec: 4, endSec: 12, rect: { x: 0.05, y: 0.12, width: 0.36, height: 0.42 }, content: { items: ['第一步', '第二步', '第三步'] }, cueTimesSec: [4, 6.5, 9], motion: { entrance: 'fade_in', emphasis: 'none', exit: 'fade_out' }, seed: 1, candidates: [], importance: 0.9 }],
    });
    expect(next.effects[0]?.content.items).toEqual([{ text: '第一步', cue: { startSec: 4 } }, { text: '第二步', cue: { startSec: 6.5 } }, { text: '第三步', cue: { startSec: 9 } }]);
  });

  it('uses source subtitles and maps explicit layers to predictable z-indexes', () => {
    const project = createFixtureProject();
    project.project.durationSec = 20;
    project.effects = [];
    const next = applyResolvedPackagingToProject(project, { overlays: [
      { id: 'main', effectId: 'cuecut-step-timeline', startSec: 1, endSec: 8, rect: { x: 0.05, y: 0.12, width: 0.36, height: 0.42 }, content: { items: ['主卡'] }, layer: 0, sourceSubtitleIds: ['source-main'], motion: { entrance: 'fade_in', emphasis: 'none', exit: 'fade_out' }, seed: 1, candidates: [], importance: 0.9 },
      { id: 'emphasis', effectId: 'cuecut-key-point', startSec: 2, endSec: 5, rect: { x: 0.5, y: 0.12, width: 0.36, height: 0.2 }, content: { text: '强调卡' }, layer: 1, sourceSubtitleIds: ['source-emphasis'], motion: { entrance: 'fade_in', emphasis: 'none', exit: 'fade_out' }, seed: 2, candidates: [], importance: 0.9 },
    ] });

    expect(next.segments.filter((segment) => segment.segmentId.startsWith('packaging-')).map((segment) => segment.sourceSubtitleIds)).toEqual([['source-main'], ['source-emphasis']]);
    expect(next.effects.map((effect) => effect.zIndex)).toEqual([10, 20]);
  });

  it('persists packaging metadata on the segment without mixing it into effect content', () => {
    const project = createFixtureProject();
    project.effects = [];
    const next = applyResolvedPackagingToProject(project, { overlays: [{
      id: 'metadata', effectId: 'cuecut-key-point', startSec: 1, endSec: 4,
      rect: { x: 0.1, y: 0.2, width: 0.36, height: 0.12 }, content: { text: '短句' },
      chapterId: 'chapter-1', sectionId: 'section-1', sourceSubtitleIds: ['subtitle-1'], selectionReason: '核心反转', visualValue: 0.88, layer: 1,
      persistence: 'section', locked: true, userOverride: { locked: true, zone: 'lower-right' }, templateQuery: { semanticRole: 'quote', tags: ['quote'], persistence: 'section' }, cadence: { stepMs: 500, cueOffsetsMs: [0] },
      motion: { entrance: 'fade_in', emphasis: 'none', exit: 'fade_out' }, seed: 1, candidates: [], importance: 0.9,
    }] });

    const segment = next.segments.find((candidate) => candidate.segmentId === 'packaging-metadata');
    expect(segment).toMatchObject({ chapterId: 'chapter-1', sectionId: 'section-1', sourceSubtitleIds: ['subtitle-1'], selectionReason: '核心反转', visualValue: 0.88, layer: 1, locked: true, zone: 'lower-right', persistence: 'section', templateQuery: { semanticRole: 'quote', persistence: 'section' }, cadence: { stepMs: 500, cueOffsetsMs: [0] } });
    expect(next.effects[0]?.content).toMatchObject({ text: '短句' });
    expect(next.effects[0]?.content).not.toHaveProperty('selectionReason');
  });

  it('keeps accumulated list items visible in SceneFrame while a process card persists', async () => {
    const { evaluateSceneAtTime } = await import('../../src/render/scene');
    const project = createFixtureProject();
    project.project.durationSec = 20;
    project.effects = [];
    const next = applyResolvedPackagingToProject(project, { overlays: [{ id: 'overlay-steps', effectId: 'cuecut-step-timeline', startSec: 4, endSec: 12, rect: { x: 0.05, y: 0.12, width: 0.36, height: 0.42 }, content: { items: ['第一步', '第二步'] }, cueTimesSec: [4, 7], motion: { entrance: 'fade_in', emphasis: 'none', exit: 'fade_out' }, seed: 1, candidates: [], importance: 0.9 }] });
    expect(evaluateSceneAtTime(next, 7.5).items.find((item) => item.effectId === 'packaging-overlay-steps')?.content).toEqual({ kind: 'list', items: ['第一步', '第二步'] });
    expect(evaluateSceneAtTime(next, 12).items.find((item) => item.effectId === 'packaging-overlay-steps')?.visible).toBe(false);
  });
});
