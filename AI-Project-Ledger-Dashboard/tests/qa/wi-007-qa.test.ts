import { readFileSync } from "node:fs";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { request, type ClientRequest } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createLedgerServer } from "../../server/index.js";
import { LedgerStore } from "../../server/ledger/store.js";
import {
  ALLOWED_LEDGER_FILES,
  isSensitivePath,
  resolveContainedArtifactPath,
} from "../../server/security/paths.js";

type LargeFixtureManifest = {
  fixtureId: string;
  projectId: string;
  taskCount: number;
  eventCount: number;
  phaseCount: number;
};

type JsonResponse = {
  status: number;
  body: Record<string, any>;
};

type SseFrame = {
  event: string;
  data: Record<string, any>;
};

type SseStream = {
  client: ClientRequest;
  waitFor: (
    eventName: string,
    predicate?: (data: Record<string, any>) => boolean,
  ) => Promise<Record<string, any>>;
};

const dashboardRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const sampleFixtureRoot = path.join(dashboardRoot, "fixtures", "sample-project");
const largeManifestPath = path.join(
  dashboardRoot,
  "fixtures",
  "project-large",
  "fixture-manifest.json",
);

function getJson(baseUrl: string, route: string): Promise<JsonResponse> {
  return new Promise((resolve, reject) => {
    const client = request(new URL(route, baseUrl), (response) => {
      const chunks: Buffer[] = [];
      response.on("data", (chunk: Buffer) => chunks.push(chunk));
      response.on("end", () => {
        try {
          resolve({
            status: response.statusCode ?? 0,
            body: JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, any>,
          });
        } catch (error) {
          reject(error);
        }
      });
    });
    client.on("error", reject);
    client.end();
  });
}

async function copySampleProject(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "wi-007-sample-"));
  await cp(sampleFixtureRoot, root, { recursive: true });
  const projectPath = path.join(root, ".ai-ledger", "project.json");
  const project = JSON.parse(await readFile(projectPath, "utf8")) as { rootPath: string };
  project.rootPath = root;
  await writeFile(projectPath, JSON.stringify(project, null, 2));
  return root;
}

function isoFor(index: number): string {
  return `2026-09-08T${String(12 + Math.floor(index / 3600)).padStart(2, "0")}:${String(Math.floor(index / 60) % 60).padStart(2, "0")}:${String(index % 60).padStart(2, "0")}.000Z`;
}

async function createLargeProject(): Promise<string> {
  const manifest = JSON.parse(readFileSync(largeManifestPath, "utf8")) as LargeFixtureManifest;
  const root = await mkdtemp(path.join(tmpdir(), "wi-007-large-"));
  const ledgerRoot = path.join(root, ".ai-ledger");
  await mkdir(ledgerRoot, { recursive: true });

  const phases = Array.from({ length: manifest.phaseCount }, (_, index) => ({
    id: `P${String(index + 1).padStart(2, "0")}`,
    name: `Synthetic phase ${index + 1}`,
    order: index + 1,
  }));
  const tasks = Array.from({ length: manifest.taskCount }, (_, index) => {
    const status = index % 5 === 0
      ? "COMPLETED"
      : index % 5 === 1
        ? "IN_PROGRESS"
        : index % 5 === 2
          ? "BLOCKED"
          : index % 5 === 3
            ? "WAITING_USER"
            : "NOT_STARTED";
    return {
      id: `T-${String(index + 1).padStart(4, "0")}`,
      phaseId: phases[index % phases.length]!.id,
      parentId: null,
      title: `Synthetic task ${index + 1}`,
      description: "Deterministic WI-007 large-project task.",
      status,
      progress: status === "COMPLETED" ? 100 : status === "IN_PROGRESS" ? 50 : status === "BLOCKED" ? 25 : 0,
      priority: index % 2 === 0 ? "P0" : "P1",
      roleId: "R06",
      agent: "QA fixture",
      sessionId: null,
      dependsOn: [],
      blockedReason: status === "BLOCKED" ? "Synthetic blocker" : null,
      waitingUserReason: status === "WAITING_USER" ? "Synthetic user input" : null,
      startedAt: status === "NOT_STARTED" ? null : isoFor(index % 3600),
      updatedAt: isoFor(index % 3600),
      completedAt: status === "COMPLETED" ? isoFor(index % 3600) : null,
      artifacts: [],
      children: [],
    };
  });
  const events = Array.from({ length: manifest.eventCount }, (_, index) => {
    const taskId = tasks[index % tasks.length]!.id;
    const type = index % 4;
    if (type === 0) {
      return {
        eventId: `evt-${String(index + 1).padStart(5, "0")}`,
        ts: isoFor(index % 3600),
        type: "PROJECT_CREATED",
        actor: "QA fixture",
      };
    }
    if (type === 1) {
      return {
        eventId: `evt-${String(index + 1).padStart(5, "0")}`,
        ts: isoFor(index % 3600),
        type: "TASK_UPDATED",
        actor: "QA fixture",
        taskId,
      };
    }
    if (type === 2) {
      return {
        eventId: `evt-${String(index + 1).padStart(5, "0")}`,
        ts: isoFor(index % 3600),
        type: "TASK_STATUS_CHANGED",
        actor: "QA fixture",
        taskId,
        from: "NOT_STARTED",
        to: "IN_PROGRESS",
      };
    }
    return {
      eventId: `evt-${String(index + 1).padStart(5, "0")}`,
      ts: isoFor(index % 3600),
      type: "TASK_PROGRESS_CHANGED",
      actor: "QA fixture",
      taskId,
      from: 0,
      to: 50,
    };
  });

  const files: Record<string, unknown> = {
    "project.json": {
      schemaVersion: 1,
      projectId: manifest.projectId,
      name: "WI-007 Synthetic Large Project",
      rootPath: root,
      createdAt: "2026-09-08T12:00:00.000Z",
      updatedAt: "2026-09-08T12:00:00.000Z",
      phases,
    },
    "tasks.json": {
      schemaVersion: 1,
      projectId: manifest.projectId,
      updatedAt: "2026-09-08T12:00:00.000Z",
      tasks,
    },
    "roles.json": {
      schemaVersion: 1,
      roles: [{ id: "R06", name: "QA fixture", agent: "local test" }],
    },
    "sessions.json": { schemaVersion: 1, sessions: [] },
    "artifacts.json": { schemaVersion: 1, artifacts: [] },
    "events.jsonl": events.map((event) => JSON.stringify(event)).join("\n") + "\n",
    "runtime.json": {
      schemaVersion: 1,
      projectId: manifest.projectId,
      ledgerWriter: "WI-007 fixture generator",
      active: true,
      currentTaskIds: tasks.filter((task) => task.status === "IN_PROGRESS").slice(0, 10).map((task) => task.id),
      lastWriteAt: "2026-09-08T12:00:00.000Z",
    },
  };

  for (const fileName of ALLOWED_LEDGER_FILES) {
    const value = files[fileName];
    await writeFile(
      path.join(ledgerRoot, fileName),
      fileName === "events.jsonl" ? String(value) : JSON.stringify(value),
    );
  }
  return root;
}

function openSseStream(baseUrl: string, route: string): Promise<SseStream> {
  return new Promise((resolve, reject) => {
    const buffered: SseFrame[] = [];
    const waiters: Array<{
      eventName: string;
      predicate: (data: Record<string, any>) => boolean;
      resolve: (data: Record<string, any>) => void;
      reject: (error: Error) => void;
    }> = [];
    let responseBody = "";

    const client = request(new URL(route, baseUrl), (response) => {
      response.setEncoding("utf8");
      const processFrame = (frame: SseFrame) => {
        const matching = waiters.find((waiter) => waiter.eventName === frame.event && waiter.predicate(frame.data));
        if (matching) {
          waiters.splice(waiters.indexOf(matching), 1);
          matching.resolve(frame.data);
        } else {
          buffered.push(frame);
        }
      };
      response.on("data", (chunk: string) => {
        responseBody += chunk;
        const frames = responseBody.split("\n\n");
        responseBody = frames.pop() ?? "";
        for (const frame of frames) {
          const event = frame.match(/^event: (.+)$/m)?.[1];
          const data = frame.match(/^data: (.+)$/m)?.[1];
          if (event && data) processFrame({ event, data: JSON.parse(data) as Record<string, any> });
        }
      });
      response.on("error", (error) => {
        for (const waiter of waiters.splice(0)) waiter.reject(error instanceof Error ? error : new Error(String(error)));
      });
      resolve({
        client,
        waitFor: (eventName, predicate = () => true) => {
          const bufferedIndex = buffered.findIndex((frame) => frame.event === eventName && predicate(frame.data));
          if (bufferedIndex >= 0) return Promise.resolve(buffered.splice(bufferedIndex, 1)[0]!.data);
          return new Promise<Record<string, any>>((waitResolve, waitReject) => {
            waiters.push({ eventName, predicate, resolve: waitResolve, reject: waitReject });
          });
        },
      });
    });
    client.on("error", (error) => {
      if ((error as NodeJS.ErrnoException).code !== "ECONNRESET") reject(error instanceof Error ? error : new Error(String(error)));
    });
    client.end();
  });
}

describe("WI-007 QA, security and self-dogfood", () => {
  it("loads the declared 1,000-task/10,000-event fixture within the QA budget and keeps 200 recent events", async () => {
    const manifest = JSON.parse(readFileSync(largeManifestPath, "utf8")) as LargeFixtureManifest;
    const projectRoot = await createLargeProject();
    try {
      const startedAt = performance.now();
      const result = await new LedgerStore().loadSnapshot(projectRoot);
      const elapsedMs = performance.now() - startedAt;

      expect(result.warning).toBeNull();
      expect(result.snapshot?.projectId).toBe(manifest.projectId);
      expect(result.snapshot?.tasks).toHaveLength(manifest.taskCount);
      expect(result.snapshot?.events).toHaveLength(manifest.eventCount);
      expect(result.snapshot?.recentEvents).toHaveLength(200);
      expect(elapsedMs).toBeLessThan(1_000);
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  }, 15_000);

  it("refreshes a large-project SSE snapshot after a watched file update within one second", async () => {
    const projectRoot = await createLargeProject();
    const server = createLedgerServer({ projectRoots: [projectRoot], port: 0, debounceMs: 150 });
    try {
      const address = await server.start();
      const stream = await openSseStream(address.baseUrl, "/api/stream?projectId=wi-007-large");
      try {
        await stream.waitFor("ledger:snapshot");
        const tasksPath = path.join(projectRoot, ".ai-ledger", "tasks.json");
        const tasks = JSON.parse(await readFile(tasksPath, "utf8")) as { tasks: Array<{ progress: number }> };
        const changedSnapshot = stream.waitFor(
          "ledger:snapshot",
          (data) => (data.snapshot as { tasks?: Array<{ progress: number }> }).tasks?.[1]?.progress === 51,
        );
        const taskChanged = stream.waitFor("task:changed", (data) => data.file === "tasks.json");
        const startedAt = performance.now();
        tasks.tasks[1]!.progress = 51;
        await writeFile(tasksPath, JSON.stringify(tasks));
        await changedSnapshot;
        await taskChanged;
        expect(performance.now() - startedAt).toBeLessThan(1_000);
      } finally {
        stream.client.destroy();
      }
    } finally {
      await server.close();
      await rm(projectRoot, { recursive: true, force: true });
    }
  }, 20_000);

  it("preserves the last known good snapshot when a local ledger JSON becomes corrupt", async () => {
    const projectRoot = await copySampleProject();
    try {
      const store = new LedgerStore();
      const first = await store.loadSnapshot(projectRoot);
      await writeFile(path.join(projectRoot, ".ai-ledger", "tasks.json"), "{ malformed");
      const second = await store.loadSnapshot(projectRoot);

      expect(first.snapshot).not.toBeNull();
      expect(second.snapshot).toBe(first.snapshot);
      expect(second.usedLastKnownGood).toBe(true);
      expect(second.warning).toMatchObject({ code: "INVALID_LEDGER" });
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });

  it("rejects traversal, absolute and sensitive artifact paths", () => {
    const root = path.resolve("F:/projects/wi-007");
    for (const candidate of [
      "../outside.txt",
      "..\\outside.txt",
      "src/../../outside.txt",
      "C:\\Windows\\system.ini",
      "\\\\server\\share\\file.txt",
      "/etc/passwd",
      ".env",
      "credentials.json",
      "docs/api-token.txt",
      "private/client-secret.json",
    ]) {
      expect(() => resolveContainedArtifactPath(root, candidate), candidate).toThrow();
    }
    expect(resolveContainedArtifactPath(root, "docs/report.md")).toBe(path.resolve(root, "docs/report.md"));
    expect(isSensitivePath("src/report.md")).toBe(false);
  });

  it("keeps the ledger read and dashboard task-state boundaries narrow", async () => {
    const projectRoot = await copySampleProject();
    try {
      const reads: string[] = [];
      await new LedgerStore({
        readFile: async (filePath: string) => {
          reads.push(filePath);
          return readFile(filePath, "utf8");
        },
      }).loadSnapshot(projectRoot);
      expect(reads.map((filePath) => path.basename(filePath)).sort()).toEqual([...ALLOWED_LEDGER_FILES].sort());
      expect(reads.some((filePath) => /\.env|credentials|token|cookie|password|ssh|secret/i.test(filePath))).toBe(false);

      const dataSource = await readFile(path.join(dashboardRoot, "web", "data.ts"), "utf8");
      const appSource = await readFile(path.join(dashboardRoot, "web", "App.tsx"), "utf8");
      expect(dataSource).toContain("/artifacts/open");
      expect(dataSource).not.toMatch(/\.ai-ledger|tasks\.json|method:\s*["'](?:PUT|PATCH|DELETE)["']/i);
      expect(dataSource.match(/method:\s*["']POST["']/g)).toHaveLength(1);
      expect(appSource).toContain("READ-ONLY");
      expect(appSource).not.toMatch(/tasks\.json|method:\s*["'](?:PUT|PATCH|DELETE)["']/i);
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });

  it("dogfoods the dashboard project's own .ai-ledger through the localhost API", async () => {
    const server = createLedgerServer({ projectRoots: [dashboardRoot], port: 0, debounceMs: 100 });
    try {
      const address = await server.start();
      expect(address.host).toBe("127.0.0.1");
      const projects = await getJson(address.baseUrl, "/api/projects");
      expect(projects.status).toBe(200);
      expect(projects.body.projects).toEqual([
        expect.objectContaining({ projectId: "ai-project-ledger-dashboard-v1", rootPath: dashboardRoot }),
      ]);

      const snapshot = await getJson(
        address.baseUrl,
        "/api/projects/ai-project-ledger-dashboard-v1/snapshot",
      );
      expect(snapshot.status).toBe(200);
      expect(snapshot.body.snapshot).toMatchObject({
        projectId: "ai-project-ledger-dashboard-v1",
        rootPath: dashboardRoot.replaceAll("\\", "/"),
      });
      expect(snapshot.body.snapshot.tasks.length).toBeGreaterThan(0);
      expect(snapshot.body.warning).toBeNull();
    } finally {
      await server.close();
    }
  });

  it("rejects non-localhost server binding", () => {
    expect(() => createLedgerServer({ host: "0.0.0.0" })).toThrow(/127\.0\.0\.1|localhost/i);
  });
});
