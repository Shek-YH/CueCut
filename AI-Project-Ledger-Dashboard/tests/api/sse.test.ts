import { existsSync } from "node:fs";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { request } from "node:http";

const fixtureRoot = path.resolve(
  fileURLToPath(new URL("../../fixtures/sample-project", import.meta.url)),
);

async function createProjectCopy(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "wi-003-sse-"));
  await cp(fixtureRoot, root, { recursive: true });
  const projectPath = path.join(root, ".ai-ledger", "project.json");
  const project = JSON.parse(await readFile(projectPath, "utf8")) as { rootPath: string };
  project.rootPath = root;
  await writeFile(projectPath, JSON.stringify(project, null, 2));
  return root;
}

async function loadServerModule(): Promise<Record<string, unknown> | undefined> {
  const modulePath = fileURLToPath(new URL("../../server/index.ts", import.meta.url));
  return existsSync(modulePath)
    ? ((await import(pathToFileURL(modulePath).href)) as Record<string, unknown>)
    : undefined;
}

function waitForSseEvent(
  baseUrl: string,
  route: string,
  eventName: string,
  trigger: () => Promise<void>,
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const client = request(new URL(route, baseUrl), (response) => {
      let buffer = "";
      response.setEncoding("utf8");
      response.on("data", (chunk: string) => {
        buffer += chunk;
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";
        for (const frame of frames) {
          const event = frame.match(/^event: (.+)$/m)?.[1];
          if (event !== eventName) continue;
          const data = frame.match(/^data: (.+)$/m)?.[1];
          if (!data) continue;
          client.destroy();
          resolve(JSON.parse(data) as Record<string, unknown>);
        }
      });
      response.on("error", reject);
    });
    client.on("error", (error) => {
      if ((error as NodeJS.ErrnoException).code !== "ECONNRESET") reject(error);
    });
    client.end();
    void trigger().catch(reject);
  });
}

describe("Ledger SSE stream", () => {
  it("emits ledger:snapshot, task:changed and error after debounced ledger changes", async () => {
    const serverModule = await loadServerModule();
    expect(serverModule).toBeDefined();
    if (!serverModule) return;
    expect(serverModule.createLedgerServer).toBeDefined();

    const projectRoot = await createProjectCopy();
    const createLedgerServer = serverModule.createLedgerServer as (options: {
      projectRoots: string[];
      port: number;
      debounceMs: number;
    }) => {
      start: () => Promise<{ baseUrl: string }>;
      close: () => Promise<void>;
    };
    const server = createLedgerServer({ projectRoots: [projectRoot], port: 0, debounceMs: 150 });
    try {
      const address = await server.start();
      const tasksPath = path.join(projectRoot, ".ai-ledger", "tasks.json");
      const validTasks = await readFile(tasksPath, "utf8");

      const snapshotEvent = await waitForSseEvent(
        address.baseUrl,
        "/api/stream?projectId=cuecut3-example",
        "ledger:snapshot",
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 20));
          await writeFile(tasksPath, validTasks.replace('"progress": 56', '"progress": 57'));
        },
      );
      expect((snapshotEvent.snapshot as { projectId: string }).projectId).toBe("cuecut3-example");

      const taskEvent = await waitForSseEvent(
        address.baseUrl,
        "/api/stream?projectId=cuecut3-example",
        "task:changed",
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 20));
          await writeFile(tasksPath, validTasks.replace('"progress": 56', '"progress": 58'));
        },
      );
      expect(taskEvent.file).toBe("tasks.json");

      const errorEvent = await waitForSseEvent(
        address.baseUrl,
        "/api/stream?projectId=cuecut3-example",
        "error",
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 20));
          await writeFile(tasksPath, "{ malformed");
        },
      );
      expect(errorEvent).toMatchObject({ code: "INVALID_LEDGER", usedLastKnownGood: true });
    } finally {
      await server.close();
      await rm(projectRoot, { recursive: true, force: true });
    }
  });
});
