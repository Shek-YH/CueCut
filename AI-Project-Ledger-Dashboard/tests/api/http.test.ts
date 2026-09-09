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
  const root = await mkdtemp(path.join(tmpdir(), "wi-003-api-"));
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

function getJson(baseUrl: string, route: string): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(route, baseUrl);
    const client = request(url, (response) => {
      const chunks: Buffer[] = [];
      response.on("data", (chunk: Buffer) => chunks.push(chunk));
      response.on("end", () => {
        try {
          resolve({
            status: response.statusCode ?? 0,
            body: JSON.parse(Buffer.concat(chunks).toString("utf8")),
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

describe("Ledger HTTP API", () => {
  it("serves projects, aggregate snapshots and event logs on localhost", async () => {
    const serverModule = await loadServerModule();
    expect(serverModule).toBeDefined();
    if (!serverModule) return;
    expect(serverModule.createLedgerServer).toBeDefined();

    const projectRoot = await createProjectCopy();
    const createLedgerServer = serverModule.createLedgerServer as (options: {
      projectRoots: string[];
      port: number;
    }) => {
      start: () => Promise<{ baseUrl: string; host: string }>;
      close: () => Promise<void>;
    };
    const server = createLedgerServer({ projectRoots: [projectRoot], port: 0 });
    try {
      const address = await server.start();
      expect(address.host).toBe("127.0.0.1");

      const projects = await getJson(address.baseUrl, "/api/projects");
      expect(projects.status).toBe(200);
      expect(projects.body.projects).toEqual([
        expect.objectContaining({ projectId: "cuecut3-example", name: "CueCut3" }),
      ]);

      const snapshot = await getJson(
        address.baseUrl,
        "/api/projects/cuecut3-example/snapshot",
      );
      expect(snapshot.status).toBe(200);
      expect(snapshot.body.snapshot.projectId).toBe("cuecut3-example");
      expect(snapshot.body.snapshot.summary).toMatchObject({ total: 4, progress: 48 });
      expect(snapshot.body.warning).toBeNull();

      const events = await getJson(
        address.baseUrl,
        "/api/projects/cuecut3-example/events",
      );
      expect(events.status).toBe(200);
      expect(events.body.events).toHaveLength(4);
      expect(events.body.events[0]).toMatchObject({ type: "TASK_COMPLETED" });
    } finally {
      await server.close();
      await rm(projectRoot, { recursive: true, force: true });
    }
  });
});
