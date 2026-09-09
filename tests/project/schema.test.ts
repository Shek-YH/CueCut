import { describe, expect, it } from 'vitest';
import { projectCompositionSchema } from '../../src/project/schema';
import { createFixtureProject } from '../../src/project/fixtures';

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
});
