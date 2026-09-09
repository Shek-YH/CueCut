import { readFile as fsReadFile } from "node:fs/promises";
import path from "node:path";
import {
  ArtifactFileSchema,
  assertProjectRootContract,
  buildPhaseSummaries,
  parseEventsJsonl,
  ProjectFileSchema,
  RoleFileSchema,
  SessionFileSchema,
  summarizeTasks,
  TaskFileSchema,
  RuntimeFileSchema,
  type Artifact,
  type LedgerEvent,
  type ProjectFile,
  type Role,
  type Runtime,
  type Session,
  type Task,
  type TaskSummary,
} from "../../packages/ledger-schema/src/index.js";
import {
  ALLOWED_LEDGER_FILES,
  assertAllowedLedgerFile,
  resolveContainedArtifactPath,
  type AllowedLedgerFile,
} from "../security/paths.js";

export type TaskTreeNode = Omit<Task, "children"> & {
  children: TaskTreeNode[];
};

export type LedgerSnapshot = {
  project: ProjectFile;
  projectId: string;
  rootPath: string;
  summary: TaskSummary;
  phases: ReturnType<typeof buildPhaseSummaries>;
  tasks: Task[];
  taskTree: TaskTreeNode[];
  roles: Role[];
  sessions: Session[];
  artifacts: Artifact[];
  runtime: Runtime;
  events: LedgerEvent[];
  recentEvents: LedgerEvent[];
};

export type LedgerWarning = {
  code: "INVALID_LEDGER";
  message: string;
};

export type LedgerLoadResult = {
  snapshot: LedgerSnapshot | null;
  warning: LedgerWarning | null;
  usedLastKnownGood: boolean;
};

export type ReadLedgerFile = (
  filePath: string,
  encoding: "utf8",
) => Promise<string>;

export type LedgerStoreOptions = {
  readFile?: ReadLedgerFile;
};

function defaultReadFile(filePath: string): Promise<string> {
  return fsReadFile(filePath, "utf8");
}

function projectRootKey(projectRoot: string): string {
  const resolved = path.resolve(projectRoot);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function parseJson<T>(fileName: AllowedLedgerFile, content: string, parse: (value: unknown) => T): T {
  let value: unknown;
  try {
    value = JSON.parse(content);
  } catch {
    throw new Error(`Invalid JSON in ${fileName}`);
  }

  try {
    return parse(value);
  } catch {
    throw new Error(`Invalid schema in ${fileName}`);
  }
}

export function buildTaskTree(tasks: Task[]): TaskTreeNode[] {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const parentByChild = new Map<string, string>();

  for (const task of tasks) {
    if (task.parentId !== null && byId.has(task.parentId)) {
      parentByChild.set(task.id, task.parentId);
    }
  }
  for (const task of tasks) {
    for (const childId of task.children) {
      if (byId.has(childId) && !parentByChild.has(childId)) {
        parentByChild.set(childId, task.id);
      }
    }
  }

  const childIdsFor = (task: Task): string[] => {
    const ids = [...task.children];
    for (const child of tasks) {
      if (child.parentId === task.id && !ids.includes(child.id)) {
        ids.push(child.id);
      }
    }
    return ids.filter((id) => parentByChild.get(id) === task.id);
  };

  const build = (task: Task, ancestors: Set<string>): TaskTreeNode => {
    const children = ancestors.has(task.id)
      ? []
      : childIdsFor(task)
          .filter((childId) => !ancestors.has(childId))
          .map((childId) => {
            const child = byId.get(childId);
            return child ? build(child, new Set([...ancestors, task.id])) : null;
          })
          .filter((child): child is TaskTreeNode => child !== null);
    const { children: _childIds, ...taskWithoutChildren } = task;
    return { ...taskWithoutChildren, children };
  };

  return tasks
    .filter((task) => !parentByChild.has(task.id))
    .map((task) => build(task, new Set()));
}

export class LedgerStore {
  private readonly readFile: ReadLedgerFile;

  private readonly lastKnownGood = new Map<string, LedgerSnapshot>();

  private readonly projectBindings = new Map<string, string>();

  public constructor(options: LedgerStoreOptions = {}) {
    this.readFile = options.readFile ?? defaultReadFile;
  }

  public getLastKnownGood(projectRoot: string): LedgerSnapshot | null {
    return this.lastKnownGood.get(projectRootKey(projectRoot)) ?? null;
  }

  public async loadSnapshot(projectRoot: string): Promise<LedgerLoadResult> {
    const key = projectRootKey(projectRoot);
    const lastKnownGood = this.lastKnownGood.get(key) ?? null;

    try {
      const snapshot = await this.readValidSnapshot(projectRoot);
      const boundProjectId = this.projectBindings.get(key);
      if (boundProjectId !== undefined && boundProjectId !== snapshot.projectId) {
        throw new Error("projectId binding changed for the project root");
      }
      this.projectBindings.set(key, snapshot.projectId);
      this.lastKnownGood.set(key, snapshot);
      return { snapshot, warning: null, usedLastKnownGood: false };
    } catch (error) {
      const detail = error instanceof Error ? error.message : "invalid ledger";
      return {
        snapshot: lastKnownGood,
        warning: { code: "INVALID_LEDGER", message: detail },
        usedLastKnownGood: lastKnownGood !== null,
      };
    }
  }

  private async readLedgerFile(projectRoot: string, fileName: AllowedLedgerFile): Promise<string> {
    assertAllowedLedgerFile(fileName);
    const filePath = path.join(path.resolve(projectRoot), ".ai-ledger", fileName);
    try {
      return await this.readFile(filePath, "utf8");
    } catch {
      throw new Error(`Unable to read ${fileName}`);
    }
  }

  private async readValidSnapshot(projectRoot: string): Promise<LedgerSnapshot> {
    const contents = new Map<AllowedLedgerFile, string>();
    for (const fileName of ALLOWED_LEDGER_FILES) {
      contents.set(fileName, await this.readLedgerFile(projectRoot, fileName));
    }

    const project = parseJson("project.json", contents.get("project.json")!, (value) =>
      ProjectFileSchema.parse(value),
    );
    const tasks = parseJson("tasks.json", contents.get("tasks.json")!, (value) =>
      TaskFileSchema.parse(value),
    );
    const roles = parseJson("roles.json", contents.get("roles.json")!, (value) =>
      RoleFileSchema.parse(value),
    );
    const sessions = parseJson("sessions.json", contents.get("sessions.json")!, (value) =>
      SessionFileSchema.parse(value),
    );
    const artifacts = parseJson("artifacts.json", contents.get("artifacts.json")!, (value) =>
      ArtifactFileSchema.parse(value),
    );
    const runtime = parseJson("runtime.json", contents.get("runtime.json")!, (value) =>
      RuntimeFileSchema.parse(value),
    );

    let events: LedgerEvent[];
    try {
      events = parseEventsJsonl(contents.get("events.jsonl")!);
    } catch {
      throw new Error("Invalid schema in events.jsonl");
    }

    const identity = assertProjectRootContract({
      project,
      tasks,
      runtime,
      sessions: sessions.sessions,
      expectedRootPath: projectRoot,
    });

    for (const artifact of artifacts.artifacts) {
      try {
        resolveContainedArtifactPath(identity.rootPath, artifact.path);
      } catch {
        throw new Error("Invalid artifact path in artifacts.json");
      }
    }

    const normalizedProject = { ...project, rootPath: identity.rootPath };
    return {
      project: normalizedProject,
      projectId: identity.projectId,
      rootPath: identity.rootPath,
      summary: summarizeTasks(tasks.tasks),
      phases: buildPhaseSummaries(project.phases, tasks.tasks),
      tasks: tasks.tasks,
      taskTree: buildTaskTree(tasks.tasks),
      roles: roles.roles,
      sessions: sessions.sessions,
      artifacts: artifacts.artifacts,
      runtime,
      events,
      recentEvents: events.slice(-200),
    };
  }
}

export async function loadLedgerSnapshot(
  projectRoot: string,
  options?: LedgerStoreOptions,
): Promise<LedgerLoadResult> {
  return new LedgerStore(options).loadSnapshot(projectRoot);
}
