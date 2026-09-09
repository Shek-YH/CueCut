import { createServer as createHttpServer, type Server } from "node:http";
import { statSync } from "node:fs";
import path from "node:path";
import { LedgerStore } from "./ledger/store.js";
import {
  LedgerApi,
  ProjectAddError,
  type AddProjectResult,
  type ProjectRegistration,
} from "./api/index.js";
import { defaultProjectRegistryPath, ProjectRegistry } from "./registry/index.js";
import { migrateLegacyProject } from "./migration/index.js";
import { createLedgerWatcher, type LedgerWatcher } from "./watcher/index.js";

export type LedgerServerOptions = {
  projectRoots?: string[];
  store?: LedgerStore;
  host?: string;
  port?: number;
  debounceMs?: number;
  registryPath?: string;
};

export type LedgerServerAddress = {
  host: string;
  port: number;
  baseUrl: string;
};

export type LedgerServer = {
  start: () => Promise<LedgerServerAddress>;
  close: () => Promise<void>;
  api: LedgerApi;
  httpServer: Server;
};

function serverAddress(server: Server, host: string): LedgerServerAddress {
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Ledger server did not expose a TCP address");
  }
  return {
    host,
    port: address.port,
    baseUrl: `http://${host}:${address.port}`,
  };
}

function projectRootKey(projectRoot: string): string {
  const resolved = path.resolve(projectRoot);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function validateProjectRoot(rootPath: string): string {
  const trimmed = rootPath.trim();
  if (trimmed === "") {
    throw new ProjectAddError(400, "Project root directory is invalid");
  }

  const resolved = path.resolve(trimmed);
  try {
    if (!statSync(resolved).isDirectory()) {
      throw new ProjectAddError(400, "Project root directory is invalid");
    }
  } catch (error) {
    if (error instanceof ProjectAddError) throw error;
    throw new ProjectAddError(400, "Project root directory is invalid");
  }
  return resolved;
}

function sameRoot(left: string, right: string): boolean {
  return projectRootKey(left) === projectRootKey(right);
}

export function createLedgerServer(options: LedgerServerOptions = {}): LedgerServer {
  const host = options.host ?? "127.0.0.1";
  if (host !== "127.0.0.1") {
    throw new Error("Ledger server must bind to 127.0.0.1");
  }

  const store = options.store ?? new LedgerStore();
  const projectRegistry = new ProjectRegistry(options.registryPath ?? defaultProjectRegistryPath());
  const api = new LedgerApi({
    store,
    addProject: async (rootPath) => addProject(rootPath),
  });
  const httpServer = createHttpServer((request, response) => {
    void api.handle(request, response).then((handled) => {
      if (!handled && !response.writableEnded) {
        response.statusCode = 404;
        response.setHeader("Content-Type", "application/json; charset=utf-8");
        response.end(JSON.stringify({ error: "Not found" }));
      }
    }).catch((error: unknown) => {
      if (response.writableEnded) return;
      response.statusCode = 500;
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      response.end(JSON.stringify({ error: "Internal server error" }));
    });
  });

  const projectRoots = [...new Set((options.projectRoots ?? []).map((root) => path.resolve(root)))];
  const watchers = new Map<string, LedgerWatcher>();
  let started = false;
  let address: LedgerServerAddress | undefined;

  function assertProjectRegistrationAvailable(project: ProjectRegistration): void {
    const activeProject = api.getProject(project.projectId);
    if (activeProject && !sameRoot(activeProject.rootPath, project.rootPath)) {
      throw new ProjectAddError(409, "Project identity is already registered to another root");
    }

    for (const registered of projectRegistry.list()) {
      if (registered.projectId === project.projectId && !sameRoot(registered.rootPath, project.rootPath)) {
        throw new ProjectAddError(409, "Project identity is already registered to another root");
      }
      if (sameRoot(registered.rootPath, project.rootPath) && registered.projectId !== project.projectId) {
        throw new ProjectAddError(409, "Project root is already registered to another project");
      }
    }
  }

  function createProjectWatcher(project: ProjectRegistration): LedgerWatcher {
    const key = projectRootKey(project.rootPath);
    const existing = watchers.get(key);
    if (existing) return existing;

    const watcher = createLedgerWatcher(
      project.rootPath,
      async ({ fileName }) => {
        const result = await store.loadSnapshot(project.rootPath);
        if (result.snapshot?.projectId === project.projectId) {
          api.setProject({
            projectId: result.snapshot.projectId,
            name: result.snapshot.project.name,
            rootPath: project.rootPath,
          });
        }
        api.broadcastReload(project.projectId, fileName, result);
      },
      {
        debounceMs: options.debounceMs,
      },
    );
    watchers.set(key, watcher);
    return watcher;
  }

  async function addProject(rootPath: string): Promise<AddProjectResult> {
    const projectRoot = validateProjectRoot(rootPath);
    let bootstrap;
    try {
      bootstrap = migrateLegacyProject({ projectRoot });
    } catch {
      throw new ProjectAddError(400, "Project could not be initialized");
    }

    const loaded = await store.loadSnapshot(projectRoot);
    if (!loaded.snapshot || loaded.warning) {
      throw new ProjectAddError(400, "Project ledger is invalid");
    }

    const project: ProjectRegistration = {
      projectId: loaded.snapshot.projectId,
      name: loaded.snapshot.project.name,
      rootPath: projectRoot,
    };
    assertProjectRegistrationAvailable(project);

    const watcher = createProjectWatcher(project);
    try {
      await watcher.ready;
      projectRegistry.add({
        projectId: project.projectId,
        rootPath: project.rootPath,
        addedAt: new Date().toISOString(),
      });
      api.setProject(project);
    } catch (error) {
      if (watchers.get(projectRootKey(projectRoot)) === watcher) {
        watchers.delete(projectRootKey(projectRoot));
        await watcher.close();
      }
      throw error;
    }

    return {
      kind: bootstrap.kind,
      project,
      warnings: bootstrap.warnings.map(({ file, line, confidence }) => ({ file, line, confidence })),
      legacyFiles: bootstrap.legacyFiles,
    };
  }

  const start = async (): Promise<LedgerServerAddress> => {
    if (started && address) return address;

    const registeredRoots = projectRegistry.list()
      .map((entry) => path.resolve(entry.rootPath))
      .filter((root) => !projectRoots.some((projectRoot) => sameRoot(projectRoot, root)));
    const startupRoots = [...projectRoots, ...registeredRoots];

    for (const projectRoot of startupRoots) {
      const result = await store.loadSnapshot(projectRoot);
      if (result.snapshot && !result.warning) {
        api.setProject({
          projectId: result.snapshot.projectId,
          name: result.snapshot.project.name,
          rootPath: projectRoot,
        });
      }
    }

    for (const projectRoot of startupRoots) {
      const project = api.listProjects().find((candidate) => sameRoot(candidate.rootPath, projectRoot));
      if (project) createProjectWatcher(project);
    }

    try {
      await Promise.all([...watchers.values()].map((watcher) => watcher.ready));
      await new Promise<void>((resolve, reject) => {
        httpServer.once("error", reject);
        httpServer.listen(options.port ?? 3000, host, () => {
          httpServer.removeListener("error", reject);
          resolve();
        });
      });
      started = true;
      address = serverAddress(httpServer, host);
      return address;
    } catch (error) {
      await Promise.all([...watchers.values()].map((watcher) => watcher.close()));
      watchers.clear();
      throw error;
    }
  };

  const close = async (): Promise<void> => {
    await Promise.all([...watchers.values()].map((watcher) => watcher.close()));
    watchers.clear();
    api.sse.close();
    if (!started) return;
    await new Promise<void>((resolve, reject) => {
      httpServer.close((error) => (error ? reject(error) : resolve()));
    });
    started = false;
    address = undefined;
  };

  return { start, close, api, httpServer };
}

export { LedgerApi, SseHub } from "./api/index.js";
export * from "./atomic.js";
export * from "./watcher/index.js";
