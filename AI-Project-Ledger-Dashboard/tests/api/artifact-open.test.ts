import { createServer, request, type Server } from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { LedgerStore } from "../../server/ledger/store.js";
import { LedgerApi, type ArtifactOpenResult } from "../../server/api/index.js";

type JsonResponse = {
  status: number;
  body: Record<string, unknown>;
};

function createTestStore(): { store: LedgerStore; loadSnapshot: ReturnType<typeof vi.fn> } {
  const loadSnapshot = vi.fn();
  return {
    store: { loadSnapshot } as unknown as LedgerStore,
    loadSnapshot,
  };
}

async function startApi(api: LedgerApi): Promise<{ baseUrl: string; server: Server }> {
  const server = createServer((request, response) => {
    void api.handle(request, response).then((handled) => {
      if (!handled && !response.writableEnded) {
        response.statusCode = 404;
        response.end(JSON.stringify({ error: "Not found" }));
      }
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not start");
  return { baseUrl: `http://127.0.0.1:${address.port}`, server };
}

async function postJson(
  baseUrl: string,
  route: string,
  body: Record<string, unknown>,
): Promise<JsonResponse> {
  return new Promise((resolve, reject) => {
    const client = request(new URL(route, baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }, (response) => {
      const chunks: Buffer[] = [];
      response.on("data", (chunk: Buffer) => chunks.push(chunk));
      response.on("end", () => {
        try {
          resolve({
            status: response.statusCode ?? 0,
            body: JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>,
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

async function closeApi(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}

describe("Artifact open API", () => {
  it("opens a registered relative artifact after containment and returns JSON metadata", async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), "wi-009-api-"));
    const { store, loadSnapshot } = createTestStore();
    const opened: string[] = [];
    const artifactOpener = vi.fn(async (resolvedPath: string): Promise<ArtifactOpenResult> => {
      opened.push(resolvedPath);
      return { status: "opened" };
    });
    const api = new LedgerApi({ store, artifactOpener });
    api.setProject({ projectId: "project-1", name: "Project One", rootPath: projectRoot });
    const { baseUrl, server } = await startApi(api);

    try {
      const response = await postJson(baseUrl, "/api/projects/project-1/artifacts/open", {
        path: "src/index.ts",
      });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        ok: true,
        code: "ARTIFACT_OPENED",
        projectId: "project-1",
        path: "src/index.ts",
        resolvedPath: path.resolve(projectRoot, "src/index.ts"),
      });
      expect(opened).toEqual([path.resolve(projectRoot, "src/index.ts")]);
      expect(artifactOpener).toHaveBeenCalledTimes(1);
      expect(loadSnapshot).not.toHaveBeenCalled();
      expect(response.body).not.toHaveProperty("contents");
    } finally {
      await closeApi(server);
      await rm(projectRoot, { recursive: true, force: true });
    }
  });

  it("rejects traversal before invoking the platform opener", async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), "wi-009-api-"));
    const { store } = createTestStore();
    const artifactOpener = vi.fn(async (): Promise<ArtifactOpenResult> => ({ status: "opened" }));
    const api = new LedgerApi({ store, artifactOpener });
    api.setProject({ projectId: "project-1", name: "Project One", rootPath: projectRoot });
    const { baseUrl, server } = await startApi(api);

    try {
      const response = await postJson(baseUrl, "/api/projects/project-1/artifacts/open", {
        path: "../outside.txt",
      });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: expect.stringMatching(/traversal|contained|relative/i),
      });
      expect(artifactOpener).not.toHaveBeenCalled();
    } finally {
      await closeApi(server);
      await rm(projectRoot, { recursive: true, force: true });
    }
  });

  it("rejects absolute paths before invoking the platform opener", async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), "wi-009-api-"));
    const { store } = createTestStore();
    const artifactOpener = vi.fn(async (): Promise<ArtifactOpenResult> => ({ status: "opened" }));
    const api = new LedgerApi({ store, artifactOpener });
    api.setProject({ projectId: "project-1", name: "Project One", rootPath: projectRoot });
    const { baseUrl, server } = await startApi(api);

    try {
      const response = await postJson(baseUrl, "/api/projects/project-1/artifacts/open", {
        path: path.resolve(projectRoot, "src/index.ts"),
      });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: expect.stringMatching(/absolute|relative/i),
      });
      expect(artifactOpener).not.toHaveBeenCalled();
    } finally {
      await closeApi(server);
      await rm(projectRoot, { recursive: true, force: true });
    }
  });

  it("rejects an unknown project before invoking the platform opener", async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), "wi-009-api-"));
    const { store } = createTestStore();
    const artifactOpener = vi.fn(async (): Promise<ArtifactOpenResult> => ({ status: "opened" }));
    const api = new LedgerApi({ store, artifactOpener });
    api.setProject({ projectId: "project-1", name: "Project One", rootPath: projectRoot });
    const { baseUrl, server } = await startApi(api);

    try {
      const response = await postJson(baseUrl, "/api/projects/unknown/artifacts/open", {
        path: "src/index.ts",
      });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: "Project not found" });
      expect(artifactOpener).not.toHaveBeenCalled();
    } finally {
      await closeApi(server);
      await rm(projectRoot, { recursive: true, force: true });
    }
  });

  it("returns an explicit platform-unavailable result after validating the path", async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), "wi-009-api-"));
    const { store } = createTestStore();
    const artifactOpener = vi.fn(async (): Promise<ArtifactOpenResult> => ({
      status: "unavailable",
      code: "PLATFORM_UNAVAILABLE",
      message: "Artifact opener is unavailable on this platform",
    }));
    const api = new LedgerApi({ store, artifactOpener });
    api.setProject({ projectId: "project-1", name: "Project One", rootPath: projectRoot });
    const { baseUrl, server } = await startApi(api);

    try {
      const response = await postJson(baseUrl, "/api/projects/project-1/artifacts/open", {
        path: "src/index.ts",
      });

      expect(response.status).toBe(501);
      expect(response.body).toMatchObject({
        ok: false,
        code: "PLATFORM_UNAVAILABLE",
        projectId: "project-1",
        path: "src/index.ts",
        resolvedPath: path.resolve(projectRoot, "src/index.ts"),
      });
      expect(artifactOpener).toHaveBeenCalledWith(path.resolve(projectRoot, "src/index.ts"));
    } finally {
      await closeApi(server);
      await rm(projectRoot, { recursive: true, force: true });
    }
  });
});
