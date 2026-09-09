import { describe, expect, it } from 'vitest';
import { createFixtureProject } from '../../src/project/fixtures';
import { createProjectPersistence, migrateProject } from '../../src/project/persistence';

function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

describe('project persistence', () => {
  it('migrates a composition without schemaVersion or subtitles', () => {
    const legacy = createFixtureProject() as unknown as Record<string, unknown>;
    delete legacy.schemaVersion;
    delete legacy.subtitles;

    expect(migrateProject(legacy)).toMatchObject({ schemaVersion: 1, subtitles: [] });
  });

  it('rejects a composition from a future schema version', () => {
    const future = { ...createFixtureProject(), schemaVersion: 2 };

    expect(() => migrateProject(future)).toThrow(/future schema version/);
  });

  it('supports save, open, close, and continue by project id', () => {
    const store = storage();
    const persistence = createProjectPersistence(store);
    const project = createFixtureProject();
    project.project.projectId = 'persisted-project';

    expect(persistence.create(project).project.projectId).toBe('persisted-project');

    expect(persistence.open('persisted-project')?.project.projectId).toBe('persisted-project');
    expect(persistence.continueProject()?.project.projectId).toBe('persisted-project');
    persistence.close('persisted-project');
    expect(persistence.open('persisted-project')).toBeNull();
  });
});
