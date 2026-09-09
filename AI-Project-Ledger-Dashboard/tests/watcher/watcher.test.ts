import { existsSync } from "node:fs";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const fixtureRoot = path.resolve(
  fileURLToPath(new URL("../../fixtures/sample-project", import.meta.url)),
);

async function loadWatcherModule(): Promise<Record<string, unknown> | undefined> {
  const modulePath = fileURLToPath(new URL("../../server/watcher/index.ts", import.meta.url));
  return existsSync(modulePath)
    ? ((await import(pathToFileURL(modulePath).href)) as Record<string, unknown>)
    : undefined;
}

async function createProjectCopy(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "wi-003-watcher-"));
  await cp(fixtureRoot, root, { recursive: true });
  const projectPath = path.join(root, ".ai-ledger", "project.json");
  const project = JSON.parse(await readFile(projectPath, "utf8")) as { rootPath: string };
  project.rootPath = root;
  await writeFile(projectPath, JSON.stringify(project, null, 2));
  return root;
}

describe("LedgerWatcher", () => {
  it("watches only the seven allowlisted files in .ai-ledger", async () => {
    const watcherModule = await loadWatcherModule();
    expect(watcherModule).toBeDefined();
    if (!watcherModule) return;

    const root = await createProjectCopy();
    try {
      const createLedgerWatcher = watcherModule.createLedgerWatcher as (
        projectRoot: string,
        onChange: () => void,
      ) => {
        watchedPaths: string[];
        ready: Promise<void>;
        close: () => Promise<void>;
      };
      const watcher = createLedgerWatcher(root, () => undefined);
      try {
        await watcher.ready;
        expect(watcher.watchedPaths.map((filePath) => path.basename(filePath)).sort()).toEqual([
          "artifacts.json",
          "events.jsonl",
          "project.json",
          "roles.json",
          "runtime.json",
          "sessions.json",
          "tasks.json",
        ]);
        expect(watcher.watchedPaths.every((filePath) =>
          filePath.startsWith(path.join(root, ".ai-ledger")),
        )).toBe(true);
      } finally {
        await watcher.close();
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("debounces allowlisted file changes within the 100-250ms contract", async () => {
    const watcherModule = await loadWatcherModule();
    expect(watcherModule).toBeDefined();
    if (!watcherModule) return;

    const root = await createProjectCopy();
    try {
      const changes: number[] = [];
      const createLedgerWatcher = watcherModule.createLedgerWatcher as (
        projectRoot: string,
        onChange: () => void,
        options?: { debounceMs?: number },
      ) => { ready: Promise<void>; close: () => Promise<void> };
      const watcher = createLedgerWatcher(root, () => changes.push(Date.now()), { debounceMs: 150 });
      try {
        await watcher.ready;
        const tasksPath = path.join(root, ".ai-ledger", "tasks.json");
        const contents = await readFile(tasksPath, "utf8");
        const startedAt = Date.now();
        await writeFile(tasksPath, contents);
        await new Promise((resolve) => setTimeout(resolve, 35));
        await writeFile(tasksPath, contents);
        await new Promise((resolve) => setTimeout(resolve, 300));

        expect(changes).toHaveLength(1);
        expect(changes[0] - startedAt).toBeGreaterThanOrEqual(100);
        expect(changes[0] - startedAt).toBeLessThan(500);
      } finally {
        await watcher.close();
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
