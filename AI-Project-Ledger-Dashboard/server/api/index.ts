import { spawn } from "node:child_process";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import type { LedgerLoadResult, LedgerStore } from "../ledger/store.js";
import { resolveContainedArtifactPath } from "../security/paths.js";
import { SseHub, type SseEventName } from "./sse.js";

export type ProjectRegistration = {
  projectId: string;
  name: string;
  rootPath: string;
};

export type ArtifactOpenResult =
  | { status: "opened" }
  | {
      status: "unavailable";
      code: "PLATFORM_UNAVAILABLE";
      message: string;
    };

export type ArtifactOpener = (
  resolvedPath: string,
) => ArtifactOpenResult | Promise<ArtifactOpenResult>;

export type AddProjectResult = {
  kind: "initialized" | "migrated" | "existing";
  project: ProjectRegistration;
  warnings: Array<{ file: string; line: number; confidence: "LOW" }>;
  legacyFiles: string[];
};

export type AddProjectHandler = (rootPath: string) => Promise<AddProjectResult>;

export class ProjectAddError extends Error {
  public readonly statusCode: 400 | 409;

  public constructor(statusCode: 400 | 409, message: string) {
    super(message);
    this.name = "ProjectAddError";
    this.statusCode = statusCode;
  }
}

function defaultArtifactOpener(resolvedPath: string): ArtifactOpenResult {
  if (process.platform !== "win32") {
    return {
      status: "unavailable",
      code: "PLATFORM_UNAVAILABLE",
      message: "Artifact opener is unavailable on this platform",
    };
  }

  const explorer = spawn("explorer.exe", [`/select,${resolvedPath}`], {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  explorer.unref();
  return { status: "opened" };
}

export type LedgerApiOptions = {
  store: LedgerStore;
  sse?: SseHub;
  artifactOpener?: ArtifactOpener;
  addProject?: AddProjectHandler;
};

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const body = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(body);
  } catch {
    throw new Error("Request body must be valid JSON");
  }
}

function sendJson(
  response: ServerResponse,
  statusCode: number,
  body: unknown,
): void {
  const payload = JSON.stringify(body);
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Content-Length", Buffer.byteLength(payload));
  response.end(payload);
}

function projectIdFromPath(pathname: string, suffix: string): string | null {
  const prefix = "/api/projects/";
  if (!pathname.startsWith(prefix) || !pathname.endsWith(suffix)) return null;
  const encodedId = pathname.slice(prefix.length, -suffix.length).replace(/\/$/, "");
  if (encodedId.includes("/")) return null;
  try {
    return decodeURIComponent(encodedId);
  } catch {
    return null;
  }
}

export class LedgerApi {
  private readonly projects = new Map<string, ProjectRegistration>();

  public readonly sse: SseHub;

  private readonly store: LedgerStore;

  private readonly artifactOpener: ArtifactOpener;

  private readonly addProject?: AddProjectHandler;

  public constructor(options: LedgerApiOptions) {
    this.store = options.store;
    this.sse = options.sse ?? new SseHub();
    this.artifactOpener = options.artifactOpener ?? defaultArtifactOpener;
    this.addProject = options.addProject;
  }

  public setProject(project: ProjectRegistration): void {
    this.projects.set(project.projectId, {
      ...project,
      rootPath: path.resolve(project.rootPath),
    });
  }

  public removeProject(projectId: string): void {
    this.projects.delete(projectId);
  }

  public getProject(projectId: string): ProjectRegistration | undefined {
    return this.projects.get(projectId);
  }

  public listProjects(): ProjectRegistration[] {
    return [...this.projects.values()];
  }

  public async handle(request: IncomingMessage, response: ServerResponse): Promise<boolean> {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    const artifactOpenProjectId = projectIdFromPath(url.pathname, "/artifacts/open");
    if (artifactOpenProjectId !== null) {
      if (request.method !== "POST") {
        sendJson(response, 405, { error: "Method not allowed" });
        return true;
      }
      await this.handleArtifactOpen(artifactOpenProjectId, request, response);
      return true;
    }

    if (url.pathname === "/api/projects") {
      if (request.method === "POST") {
        await this.handleAddProject(request, response);
        return true;
      }
      if (request.method !== "GET") {
        sendJson(response, 405, { error: "Method not allowed" });
        return true;
      }
      sendJson(response, 200, { projects: this.listProjects() });
      return true;
    }

    if (request.method !== "GET") {
      sendJson(response, 405, { error: "Method not allowed" });
      return true;
    }

    const snapshotProjectId = projectIdFromPath(url.pathname, "/snapshot");
    if (snapshotProjectId !== null) {
      const project = this.projects.get(snapshotProjectId);
      if (!project) {
        sendJson(response, 404, { error: "Project not found" });
        return true;
      }
      const result = await this.store.loadSnapshot(project.rootPath);
      this.sendSnapshotResult(response, result);
      return true;
    }

    const eventsProjectId = projectIdFromPath(url.pathname, "/events");
    if (eventsProjectId !== null) {
      const project = this.projects.get(eventsProjectId);
      if (!project) {
        sendJson(response, 404, { error: "Project not found" });
        return true;
      }
      const result = await this.store.loadSnapshot(project.rootPath);
      if (!result.snapshot) {
        sendJson(response, 503, { warning: result.warning, usedLastKnownGood: false, events: [] });
        return true;
      }
      sendJson(response, 200, {
        projectId: result.snapshot.projectId,
        events: result.snapshot.events,
        warning: result.warning,
        usedLastKnownGood: result.usedLastKnownGood,
      });
      return true;
    }

    if (url.pathname === "/api/stream") {
      await this.handleStream(url.searchParams.get("projectId"), request, response);
      return true;
    }

    return false;
  }

  private async handleAddProject(
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<void> {
    let body: unknown;
    try {
      body = await readJsonBody(request);
    } catch {
      sendJson(response, 400, { error: "Request body must be valid JSON" });
      return;
    }

    const rootPath = body && typeof body === "object" && "rootPath" in body
      ? (body as { rootPath?: unknown }).rootPath
      : undefined;
    if (typeof rootPath !== "string" || rootPath.trim() === "") {
      sendJson(response, 400, { error: "rootPath is required" });
      return;
    }

    if (!this.addProject) {
      sendJson(response, 503, { error: "Project add is unavailable" });
      return;
    }

    try {
      const result = await this.addProject(rootPath);
      sendJson(response, 201, {
        ok: true,
        kind: result.kind,
        project: result.project,
        warnings: result.warnings,
        legacyFiles: result.legacyFiles,
      });
    } catch (error) {
      if (error instanceof ProjectAddError) {
        sendJson(response, error.statusCode, { error: error.message });
        return;
      }
      sendJson(response, 500, { error: "Project could not be added" });
    }
  }

  private async handleArtifactOpen(
    projectId: string,
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<void> {
    const project = this.projects.get(projectId);
    if (!project) {
      sendJson(response, 404, { error: "Project not found" });
      return;
    }

    let artifactPath: unknown;
    try {
      const body = await readJsonBody(request);
      artifactPath = body && typeof body === "object" && "path" in body
        ? (body as { path?: unknown }).path
        : undefined;
    } catch (error) {
      sendJson(response, 400, {
        error: error instanceof Error ? error.message : "Invalid request body",
      });
      return;
    }

    if (typeof artifactPath !== "string") {
      sendJson(response, 400, { error: "Artifact path must be a string" });
      return;
    }

    let resolvedPath: string;
    try {
      resolvedPath = resolveContainedArtifactPath(project.rootPath, artifactPath);
    } catch (error) {
      sendJson(response, 400, {
        error: error instanceof Error ? error.message : "Invalid artifact path",
      });
      return;
    }

    const result = await this.artifactOpener(resolvedPath);
    if (result.status === "unavailable") {
      sendJson(response, 501, {
        ok: false,
        code: result.code,
        message: result.message,
        projectId,
        path: artifactPath,
        resolvedPath,
      });
      return;
    }

    sendJson(response, 200, {
      ok: true,
      code: "ARTIFACT_OPENED",
      message: "Artifact opener invoked",
      projectId,
      path: artifactPath,
      resolvedPath,
    });
  }

  public broadcastReload(
    projectId: string,
    fileName: string,
    result: LedgerLoadResult,
  ): void {
    if (result.warning) {
      this.sse.broadcast(projectId, "error", {
        ...result.warning,
        file: fileName,
        usedLastKnownGood: result.usedLastKnownGood,
      });
    }
    if (result.snapshot) {
      this.sse.broadcast(projectId, "ledger:snapshot", {
        snapshot: result.snapshot,
        warning: result.warning,
        usedLastKnownGood: result.usedLastKnownGood,
      });
    }

    const eventByFile: Record<string, SseEventName> = {
      "tasks.json": "task:changed",
      "events.jsonl": "event:appended",
      "runtime.json": "runtime:changed",
    };
    const event = eventByFile[fileName];
    if (event) this.sse.broadcast(projectId, event, { file: fileName });
  }

  private sendSnapshotResult(response: ServerResponse, result: LedgerLoadResult): void {
    if (!result.snapshot) {
      sendJson(response, 503, {
        snapshot: null,
        warning: result.warning,
        usedLastKnownGood: false,
      });
      return;
    }
    sendJson(response, 200, {
      snapshot: result.snapshot,
      warning: result.warning,
      usedLastKnownGood: result.usedLastKnownGood,
    });
  }

  private async handleStream(
    projectId: string | null,
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<void> {
    if (!projectId) {
      sendJson(response, 400, { error: "projectId is required" });
      return;
    }
    const project = this.projects.get(projectId);
    if (!project) {
      sendJson(response, 404, { error: "Project not found" });
      return;
    }

    response.statusCode = 200;
    response.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    response.setHeader("Cache-Control", "no-cache, no-transform");
    response.setHeader("Connection", "keep-alive");
    response.flushHeaders();
    const unsubscribe = this.sse.subscribe(projectId, response);
    const removeClient = () => unsubscribe();
    request.once("close", removeClient);
    response.once("close", removeClient);

    const result = await this.store.loadSnapshot(project.rootPath);
    if (result.warning) {
      this.sse.send(response, "error", {
        ...result.warning,
        usedLastKnownGood: result.usedLastKnownGood,
      });
    }
    if (result.snapshot) {
      this.sse.send(response, "ledger:snapshot", {
        snapshot: result.snapshot,
        warning: result.warning,
        usedLastKnownGood: result.usedLastKnownGood,
      });
    }
  }
}

export { SseHub } from "./sse.js";
