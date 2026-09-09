import { projectCompositionSchema, type ProjectComposition } from './schema';

export interface ProjectStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const storageKey = 'cuecut.projects.v1';
const currentSchemaVersion = 1;

function clone<T>(value: T): T {
  return structuredClone(value);
}

export function migrateProject(input: unknown): ProjectComposition {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Project must be an object');
  const next = clone(input) as Record<string, unknown>;
  const version = next.schemaVersion === undefined ? 0 : next.schemaVersion;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 0) throw new Error('Unsupported project schema version');
  if (version > currentSchemaVersion) throw new Error(`Project uses a future schema version: ${version}`);
  if (version < 1) next.schemaVersion = 1;
  if (next.subtitles === undefined) next.subtitles = [];
  return projectCompositionSchema.parse(next);
}

export function serializeProject(project: ProjectComposition): string {
  return JSON.stringify(migrateProject(project));
}

function readIndex(storage: ProjectStorage): Record<string, string> {
  const raw = storage.getItem(storageKey);
  if (!raw) return {};
  const parsed = JSON.parse(raw) as unknown;
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, string> : {};
}

export function createProjectPersistence(storage: ProjectStorage) {
  let index = readIndex(storage);
  let lastProjectId = storage.getItem(`${storageKey}:last`);

  const flush = () => storage.setItem(storageKey, JSON.stringify(index));

  const save = (project: ProjectComposition): void => {
    const migrated = migrateProject(project);
    index = { ...index, [migrated.project.projectId]: serializeProject(migrated) };
    lastProjectId = migrated.project.projectId;
    flush();
    storage.setItem(`${storageKey}:last`, lastProjectId);
  };

  const open = (projectId: string): ProjectComposition | null => {
    const raw = index[projectId];
    if (!raw) return null;
    return migrateProject(JSON.parse(raw));
  };

  return {
    create(project: ProjectComposition): ProjectComposition { const created = migrateProject(project); save(created); return created; },
    save,
    open,
    close(projectId: string): void {
      if (!index[projectId]) return;
      const next = { ...index };
      delete next[projectId];
      index = next;
      if (lastProjectId === projectId) lastProjectId = null;
      flush();
      if (lastProjectId) storage.setItem(`${storageKey}:last`, lastProjectId);
      else storage.removeItem(`${storageKey}:last`);
    },
    continueProject(): ProjectComposition | null {
      return lastProjectId ? open(lastProjectId) : null;
    },
  };
}
