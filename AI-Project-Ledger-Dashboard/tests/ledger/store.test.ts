import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const dashboardRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const fixtureRoot = path.join(dashboardRoot, "fixtures", "sample-project");

async function loadLedgerModule(): Promise<Record<string, unknown> | undefined> {
  const modulePath = fileURLToPath(
    new URL("../../server/ledger/store.ts", import.meta.url),
  );
  return existsSync(modulePath)
    ? ((await import(pathToFileURL(modulePath).href)) as Record<string, unknown>)
    : undefined;
}

async function createProjectCopy(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "wi-002-ledger-"));
  await cp(fixtureRoot, root, { recursive: true });
  const projectPath = path.join(root, ".ai-ledger", "project.json");
  const project = JSON.parse(await readFile(projectPath, "utf8")) as {
    rootPath: string;
  };
  project.rootPath = root;
  await writeFile(projectPath, JSON.stringify(project, null, 2));
  return root;
}

describe("LedgerStore", () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await createProjectCopy();
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it("loads a stable projectId bound to the project root and aggregates the task tree", async () => {
    const ledger = await loadLedgerModule();
    expect(ledger).toBeDefined();
    if (!ledger) return;

    const LedgerStore = ledger.LedgerStore as new (options?: unknown) => {
      loadSnapshot(root: string): Promise<{
        snapshot: {
          project: { projectId: string; rootPath: string };
          summary: { total: number; progress: number };
          phases: Array<{ id: string; progress: number; taskCount: number }>;
          taskTree: Array<{ id: string }>;
        };
        warning: unknown;
      }>;
    };
    const store = new LedgerStore();
    const result = await store.loadSnapshot(projectRoot);

    expect(result.warning).toBeNull();
    expect(result.snapshot.project.projectId).toBe("cuecut3-example");
    expect(result.snapshot.project.rootPath).toBe(projectRoot.replaceAll("\\", "/"));
    expect(result.snapshot.summary).toMatchObject({ total: 4, progress: 48 });
    expect(result.snapshot.phases).toEqual([
      { id: "P01", name: "项目分析", order: 1, progress: 100, taskCount: 1 },
      { id: "P02", name: "开发实现", order: 2, progress: 46, taskCount: 2 },
      { id: "P03", name: "测试验收", order: 3, progress: 0, taskCount: 1 },
    ]);
    expect(result.snapshot.taskTree.map((task) => task.id)).toEqual([
      "T-001",
      "T-002",
      "T-003",
      "T-004",
    ]);
  });

  it("keeps the latest 200 events in order and all events when fewer exist", async () => {
    const ledger = await loadLedgerModule();
    expect(ledger).toBeDefined();
    if (!ledger) return;

    const eventsPath = path.join(projectRoot, ".ai-ledger", "events.jsonl");
    const events = Array.from({ length: 205 }, (_, index) => ({
      eventId: `bulk-${index + 1}`,
      ts: "2026-09-08T12:00:00-04:00",
      type: "PROJECT_CREATED",
      actor: "test",
    }));
    await writeFile(eventsPath, events.map((event) => JSON.stringify(event)).join("\n"));

    const LedgerStore = ledger.LedgerStore as new (options?: unknown) => {
      loadSnapshot(root: string): Promise<{
        snapshot: { recentEvents: Array<{ eventId: string }> };
      }>;
    };
    const store = new LedgerStore();
    const result = await store.loadSnapshot(projectRoot);

    expect(result.snapshot.recentEvents).toHaveLength(200);
    expect(result.snapshot.recentEvents.map((event) => event.eventId)).toEqual(
      Array.from({ length: 200 }, (_, index) => `bulk-${index + 6}`),
    );

    await writeFile(
      eventsPath,
      JSON.stringify({
        eventId: "only-event",
        ts: "2026-09-08T12:00:00-04:00",
        type: "PROJECT_CREATED",
        actor: "test",
      }),
    );
    const smaller = await store.loadSnapshot(projectRoot);

    expect(smaller.snapshot.recentEvents.map((event) => event.eventId)).toEqual([
      "only-event",
    ]);
  });

  it("reads only the allowlisted seven ledger files and never sensitive files", async () => {
    const ledger = await loadLedgerModule();
    expect(ledger).toBeDefined();
    if (!ledger) return;

    const reads: string[] = [];
    const LedgerStore = ledger.LedgerStore as new (options?: unknown) => {
      loadSnapshot(root: string): Promise<unknown>;
    };
    const store = new LedgerStore({
      readFile: async (filePath: string) => {
        reads.push(filePath);
        return readFile(filePath, "utf8");
      },
    });
    await store.loadSnapshot(projectRoot);

    expect(reads.map((filePath) => path.basename(filePath)).sort()).toEqual([
      "artifacts.json",
      "events.jsonl",
      "project.json",
      "roles.json",
      "runtime.json",
      "sessions.json",
      "tasks.json",
    ]);
    expect(reads.some((filePath) => /\.env|credentials|token|cookie|password|ssh|secret/i.test(filePath))).toBe(
      false,
    );
  });

  it("retains the last known good snapshot and exposes a warning after malformed JSON", async () => {
    const ledger = await loadLedgerModule();
    expect(ledger).toBeDefined();
    if (!ledger) return;

    const LedgerStore = ledger.LedgerStore as new (options?: unknown) => {
      loadSnapshot(root: string): Promise<{
        snapshot: unknown;
        warning: { code: string; message: string } | null;
        usedLastKnownGood: boolean;
      }>;
    };
    const store = new LedgerStore();
    const first = await store.loadSnapshot(projectRoot);
    await writeFile(path.join(projectRoot, ".ai-ledger", "tasks.json"), "{ malformed");
    const second = await store.loadSnapshot(projectRoot);

    expect(second.snapshot).toBe(first.snapshot);
    expect(second.usedLastKnownGood).toBe(true);
    expect(second.warning).toMatchObject({ code: "INVALID_LEDGER" });
    expect(second.warning?.message).toMatch(/tasks\.json|invalid|malformed/i);
  });

  it("retains the last known good snapshot after schema-invalid JSON and rejects project identity drift", async () => {
    const ledger = await loadLedgerModule();
    expect(ledger).toBeDefined();
    if (!ledger) return;

    const LedgerStore = ledger.LedgerStore as new (options?: unknown) => {
      loadSnapshot(root: string): Promise<{
        snapshot: unknown;
        warning: { code: string; message: string } | null;
        usedLastKnownGood: boolean;
      }>;
    };
    const store = new LedgerStore();
    const first = await store.loadSnapshot(projectRoot);
    const tasksPath = path.join(projectRoot, ".ai-ledger", "tasks.json");
    const tasks = JSON.parse(await readFile(tasksPath, "utf8")) as { projectId: string };
    tasks.projectId = "session-001";
    await writeFile(tasksPath, JSON.stringify(tasks));
    const invalidSchema = await store.loadSnapshot(projectRoot);
    expect(invalidSchema.snapshot).toBe(first.snapshot);
    expect(invalidSchema.usedLastKnownGood).toBe(true);
    expect(invalidSchema.warning).toMatchObject({ code: "INVALID_LEDGER" });

    const projectPath = path.join(projectRoot, ".ai-ledger", "project.json");
    const project = JSON.parse(await readFile(projectPath, "utf8")) as { projectId: string };
    const validTasks = JSON.parse(await readFile(tasksPath, "utf8")) as { projectId: string };
    validTasks.projectId = "cuecut3-example";
    await writeFile(tasksPath, JSON.stringify(validTasks));
    project.projectId = "a-different-stable-id";
    await writeFile(projectPath, JSON.stringify(project));
    const drifted = await store.loadSnapshot(projectRoot);
    expect(drifted.snapshot).toBe(first.snapshot);
    expect(drifted.usedLastKnownGood).toBe(true);
    expect(drifted.warning?.message).toMatch(/projectId|identity|stable/i);
  });
});
