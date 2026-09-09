import { describe, expect, it } from 'vitest';
import { projectCompositionSchema } from '../../src/project/schema';
import { createFixtureProject } from '../../src/project/fixtures';

describe('cuecut.composition/1 schema', () => {
  it('accepts a complete local composition with nullable sfx', () => {
    const result = projectCompositionSchema.safeParse(createFixtureProject());

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.schema).toBe('cuecut.composition/1');
      expect(result.data.effects[0]?.sfx).toBeNull();
      expect(result.data.effects[0]?.layout.nx).toBeGreaterThanOrEqual(0);
      expect(result.data.project.video).toEqual({ sourceFileName: null, zIndex: 0, locked: true });
    }
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
});
