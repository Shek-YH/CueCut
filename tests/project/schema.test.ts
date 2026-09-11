import { describe, expect, it } from 'vitest';
import { projectCompositionSchema } from '../../src/project/schema';
import { createFixtureProject } from '../../src/project/fixtures';
import { createProjectStore } from '../../src/project/store';

describe('cuecut.composition/1 schema', () => {
  it('accepts a complete local composition with nullable sfx', () => {
    const result = projectCompositionSchema.safeParse(createFixtureProject());

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.schema).toBe('cuecut.composition/1');
      expect(result.data.schemaVersion).toBe(1);
      expect(result.data.subtitles).toEqual([]);
      expect(result.data.effects[0]?.sfx).toBeNull();
      expect(result.data.effects[0]?.layout.nx).toBeGreaterThanOrEqual(0);
      expect(result.data.project.video).toEqual({ sourceFileName: null, zIndex: 0, locked: true });
    }
  });

  it('supplies bounded subtitle settings defaults when parsing a legacy composition', () => {
    const legacy = createFixtureProject();
    const result = projectCompositionSchema.parse(legacy);

    expect(result.subtitleSettings).toMatchObject({
      visible: true,
      fontSize: 42,
      lineHeight: 1.2,
      letterSpacing: 0,
    });
    expect(result.subtitleSettings.position).toBe('bottom');
  });

  it('rejects out-of-bounds subtitle settings', () => {
    const project = createFixtureProject();
    project.subtitleSettings = {
      visible: true,
      fontSize: 500,
      color: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidth: 2,
      lineHeight: 1.2,
      letterSpacing: 0,
      position: 'bottom',
    };

    expect(projectCompositionSchema.safeParse(project).success).toBe(false);
  });

  it('updates subtitle settings through one undoable validated store transaction', () => {
    const store = createProjectStore(createFixtureProject());

    store.setSubtitleSettings({ visible: false });

    expect(store.getSnapshot().subtitleSettings.visible).toBe(false);
    expect(store.undoDepth()).toBe(1);
    expect(() => store.setSubtitleSettings({ fontSize: 500 })).toThrow();
    expect(store.undoDepth()).toBe(1);
  });

  it('clamps edited subtitle timing to the project duration', () => {
    const store = createProjectStore(createFixtureProject());
    store.setSubtitles([{ id: 's-1', startSec: 1, endSec: 2, text: 'caption' }]);

    store.updateSubtitle('s-1', (subtitle) => ({ ...subtitle, startSec: 29, endSec: 40 }));

    expect(store.getSnapshot().subtitles[0]).toMatchObject({ startSec: 29, endSec: 30 });
  });

  it('keeps canonical subtitles inside the composition', () => {
    const project = createFixtureProject();
    project.subtitles = [{ id: 's-1', startSec: 0, endSec: 1.2, text: '中文 caption' }];

    const result = projectCompositionSchema.parse(project);

    expect(result.subtitles).toEqual(project.subtitles);
  });

  it('rejects a layout outside normalized coordinates', () => {
    const project = createFixtureProject();
    project.effects[0]!.layout.nx = 1.2;

    const result = projectCompositionSchema.safeParse(project);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes('nx'))).toBe(true);
    }
  });

  it('rejects an effect whose end is not after its start', () => {
    const project = createFixtureProject();
    project.effects[0]!.time.endSec = project.effects[0]!.time.startSec;

    const result = projectCompositionSchema.safeParse(project);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes('endSec'))).toBe(true);
    }
  });

  it('rejects effect timing that exceeds the project duration', () => {
    const project = createFixtureProject();
    project.effects[0]!.time.endSec = 31;

    const result = projectCompositionSchema.safeParse(project);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes('endSec'))).toBe(true);
    }
  });

  it('rejects motion ids that are not formally registered', () => {
    const project = createFixtureProject();
    project.effects[0]!.motion.enter.motionId = 'pack:cuecut-not-registered';

    const result = projectCompositionSchema.safeParse(project);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((issue) => issue.path.includes('motionId'))).toBe(true);
  });

  it('persists optional packaging metadata on composition segments', () => {
    const project = createFixtureProject();
    const projectWithPackagingMetadata = {
      ...project,
      segments: [...project.segments, {
        segmentId: 'packaging-overlay-1',
        sourceSubtitleIds: ['subtitle-1'],
        startSec: 8,
        endSec: 12,
        intent: 'packaging',
        importance: 0.9,
        chapterId: 'chapter-1',
        sectionId: 'section-1',
        selectionReason: '核心流程',
        visualValue: 0.88,
        layer: 1,
        locked: true,
        zone: 'lower-right',
        persistence: 'section',
        templateQuery: { semanticRole: 'ordered-process', tags: ['steps'], persistence: 'section' },
        cadence: { stepMs: 1000, cueOffsetsMs: [0, 1000] },
      }],
    };

    const result = projectCompositionSchema.parse(projectWithPackagingMetadata);

    expect(result.segments.at(-1)).toMatchObject({
      chapterId: 'chapter-1', sectionId: 'section-1', sourceSubtitleIds: ['subtitle-1'], selectionReason: '核心流程', visualValue: 0.88,
      layer: 1, locked: true, zone: 'lower-right', persistence: 'section', templateQuery: { semanticRole: 'ordered-process', persistence: 'section' }, cadence: { stepMs: 1000, cueOffsetsMs: [0, 1000] },
    });
  });
});
