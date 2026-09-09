import { cp, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { request } from "node:http";
import { fileURLToPath } from "node:url";
import { createLedgerServer } from "../../server/index.js";

type JsonResponse = {
  status: number;
  body: Record<string, any>;
};

type TestServer = ReturnType<typeof createLedgerServer>;

const sampleFixtureRoot = path.resolve(
  fileURLToPath(new URL("../../fixtures/sample-project", import.meta.url)),
);
const legacyFixtureRoot = path.resolve(
  fileURLToPath(new URL("../../fixtures/project-legacy-md", import.meta.url)),
);

async function startServer(projectRoot?: string): Promise<{
  server: TestServer;
  baseUrl: string;
  registryPath: string;
}> {
  const registryRoot = await mkdtemp(path.join(tmpdir(), "wi-011-registry-"));
  const registryPath = path.join(registryRoot, "projects.json");
  const server = createLedgerServer({
    projectRoots: projectRoot ? [projectRoot] : [],
    registryPath,
    port: 0,
    debounceMs: 100,
  } as Parameters<typeof createLedgerServer>[0] & { registryPath: string });
  const address = await server.start();
  return { server, baseUrl: address.baseUrl, registryPath };
}

async function postJson(
  baseUrl: string,
  body: unknown,
): Promise<JsonResponse> {
  return new Promise((resolve, reject) => {
    const client = request(new URL("/api/projects", baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }, (response) => {
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
    client.end(JSON.stringify(body));
  });
}

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

async function copyFixture(fixtureRoot: string, prefix: string): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), prefix));
  await cp(fixtureRoot, root, { recursive: true });
  const projectPath = path.join(root, ".ai-ledger", "project.json");
  try {
    const project = JSON.parse(await readFile(projectPath, "utf8")) as { rootPath: string };
    project.rootPath = root;
    await writeFile(projectPath, JSON.stringify(project, null, 2));
  } catch {
    // Legacy fixtures do not contain a machine project manifest yet.
  }
  return root;
}

async function closeServer(server: TestServer, registryPath: string): Promise<void> {
  await server.close();
  await rm(path.dirname(registryPath), { recursive: true, force: true });
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
          if (frame.match(/^event: (.+)$/m)?.[1] !== eventName) continue;
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

describe("Dynamic Add Project API", () => {
  it("registers an existing ledger and exposes it immediately", async () => {
    const projectRoot = await copyFixture(sampleFixtureRoot, "wi-011-existing-");
    const tasksPath = path.join(projectRoot, ".ai-ledger", "tasks.json");
    const tasksBefore = await readFile(tasksPath, "utf8");
    const { server, baseUrl, registryPath } = await startServer();

    try {
      const response = await postJson(baseUrl, { rootPath: projectRoot });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        ok: true,
        kind: "existing",
        project: {
          projectId: "cuecut3-example",
          name: "CueCut3",
          rootPath: path.resolve(projectRoot),
        },
      });
      expect((await getJson(baseUrl, "/api/projects")).body.projects).toEqual([
        expect.objectContaining({ projectId: "cuecut3-example" }),
      ]);
      expect((await getJson(baseUrl, "/api/projects/cuecut3-example/snapshot")).status).toBe(200);
      expect(await readFile(tasksPath, "utf8")).toBe(tasksBefore);

      const registry = JSON.parse(await readFile(registryPath, "utf8")) as {
        projects: Array<{ projectId: string; rootPath: string }>;
      };
      expect(registry.projects).toEqual([
        { projectId: "cuecut3-example", rootPath: path.resolve(projectRoot), addedAt: expect.any(String) },
      ]);
    } finally {
      await closeServer(server, registryPath);
      await rm(projectRoot, { recursive: true, force: true });
    }
  });

  it("starts a watcher for a dynamically added project", async () => {
    const projectRoot = await copyFixture(sampleFixtureRoot, "wi-011-watcher-");
    const { server, baseUrl, registryPath } = await startServer();

    try {
      const added = await postJson(baseUrl, { rootPath: projectRoot });
      expect(added.status).toBe(201);
      const tasksPath = path.join(projectRoot, ".ai-ledger", "tasks.json");
      const validTasks = await readFile(tasksPath, "utf8");

      const event = await waitForSseEvent(
        baseUrl,
        "/api/stream?projectId=cuecut3-example",
        "task:changed",
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 20));
          await writeFile(tasksPath, validTasks.replace('"progress": 56', '"progress": 57'));
        },
      );

      expect(event.file).toBe("tasks.json");
    } finally {
      await closeServer(server, registryPath);
      await rm(projectRoot, { recursive: true, force: true });
    }
  });

  it("migrates legacy Markdown additively and keeps the Markdown bytes unchanged", async () => {
    const projectRoot = await copyFixture(legacyFixtureRoot, "wi-011-legacy-");
    const markdownSnapshot = new Map<string, string>();
    for (const name of (await readdir(projectRoot)).filter((entry) => entry.endsWith(".md"))) {
      markdownSnapshot.set(name, await readFile(path.join(projectRoot, name), "utf8"));
    }
    const { server, baseUrl, registryPath } = await startServer();

    try {
      const response = await postJson(baseUrl, { rootPath: projectRoot });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({ ok: true, kind: "migrated" });
      expect(response.body.project.projectId).toBeTruthy();
      expect(response.body.warnings).toEqual(expect.arrayContaining([
        expect.objectContaining({ confidence: "LOW" }),
      ]));
      expect(await readFile(path.join(projectRoot, ".ai-ledger", "tasks.json"), "utf8")).toContain("COMPLETED");
      for (const [name, content] of markdownSnapshot) {
        expect(await readFile(path.join(projectRoot, name), "utf8")).toBe(content);
      }
    } finally {
      await closeServer(server, registryPath);
      await rm(projectRoot, { recursive: true, force: true });
    }
  });

  it("initializes and registers an empty project skeleton", async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), "wi-011-empty-"));
    const { server, baseUrl, registryPath } = await startServer();

    try {
      const response = await postJson(baseUrl, { rootPath: projectRoot });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({ ok: true, kind: "initialized" });
      expect(response.body.project.rootPath).toBe(path.resolve(projectRoot));
      expect(JSON.parse(await readFile(path.join(projectRoot, ".ai-ledger", "tasks.json"), "utf8"))).toMatchObject({
        projectId: response.body.project.projectId,
        tasks: [],
      });
      expect((await getJson(baseUrl, "/api/projects")).body.projects).toHaveLength(1);
    } finally {
      await closeServer(server, registryPath);
      await rm(projectRoot, { recursive: true, force: true });
    }
  });

  it("rejects invalid roots without returning the supplied secret-like path", async () => {
    const { server, baseUrl, registryPath } = await startServer();
    const secretLikePath = path.join(path.dirname(registryPath), "private-secret-token");

    try {
      const response = await postJson(baseUrl, { rootPath: secretLikePath });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "Project root directory is invalid" });
      expect(JSON.stringify(response.body)).not.toContain("private-secret-token");
    } finally {
      await closeServer(server, registryPath);
    }
  });

  it("rejects an existing ledger whose project root binding is different", async () => {
    const projectRoot = await copyFixture(sampleFixtureRoot, "wi-011-binding-");
    const projectPath = path.join(projectRoot, ".ai-ledger", "project.json");
    const project = JSON.parse(await readFile(projectPath, "utf8")) as { rootPath: string };
    project.rootPath = path.join(projectRoot, "secret-token-root");
    await writeFile(projectPath, JSON.stringify(project, null, 2));
    const { server, baseUrl, registryPath } = await startServer();

    try {
      const response = await postJson(baseUrl, { rootPath: projectRoot });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "Project ledger is invalid" });
      expect(JSON.stringify(response.body)).not.toContain("secret-token-root");
      expect((await getJson(baseUrl, "/api/projects")).body.projects).toEqual([]);
    } finally {
      await closeServer(server, registryPath);
      await rm(projectRoot, { recursive: true, force: true });
    }
  });
});
