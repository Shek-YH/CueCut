import type { ProjectRegistration, SnapshotEnvelope } from "./types.js";

export type SnapshotLoader = (
  projectId: string,
  signal?: AbortSignal,
) => Promise<SnapshotEnvelope>;

export type AddProjectResult = {
  ok: true;
  kind: "initialized" | "migrated" | "existing";
  project: ProjectRegistration;
  warnings: Array<{ file: string; line: number; confidence: "LOW" }>;
  legacyFiles: string[];
};

export type ProjectAdder = (
  rootPath: string,
  signal?: AbortSignal,
) => Promise<AddProjectResult>;

const POST_METHOD = "POST";

export type ArtifactOpener = (projectId: string, artifactPath: string) => Promise<void>;

export async function fetchProjects(signal?: AbortSignal): Promise<ProjectRegistration[]> {
  const response = await fetch("/api/projects", {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) {
    throw new Error(`Unable to load projects (${response.status})`);
  }
  const body = (await response.json()) as { projects?: ProjectRegistration[] };
  return body.projects ?? [];
}

export const addProject: ProjectAdder = async (rootPath, signal) => {
  const response = await fetch("/api/projects", {
    method: POST_METHOD,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ rootPath }),
    signal,
  });

  let body: Partial<AddProjectResult> & { error?: string } = {};
  try {
    body = (await response.json()) as Partial<AddProjectResult> & { error?: string };
  } catch {
    // Keep the HTTP status as the fallback when the backend has no JSON body.
  }
  if (!response.ok || body.ok !== true) {
    throw new Error(body.error ?? `Unable to add project (${response.status})`);
  }
  return body as AddProjectResult;
};

export const fetchProjectSnapshot: SnapshotLoader = async (projectId, signal) => {
  const response = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/snapshot`,
    {
      headers: { Accept: "application/json" },
      signal,
    },
  );
  const body = (await response.json()) as SnapshotEnvelope & { error?: string };
  if (!response.ok || !body.snapshot) {
    throw new Error(body.error ?? body.warning?.message ?? `Unable to load snapshot (${response.status})`);
  }
  return body;
};

export async function openArtifactParentFolder(
  projectId: string,
  artifactPath: string,
): Promise<void> {
  const response = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/artifacts/open`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path: artifactPath }),
    },
  );
  if (response.ok) return;

  let body: { error?: string; message?: string } = {};
  try {
    body = (await response.json()) as { error?: string; message?: string };
  } catch {
    // Keep the HTTP status as the fallback when the backend has no JSON error body.
  }
  throw new Error(body.error ?? body.message ?? `Unable to open parent folder (${response.status})`);
}

export type EventSourceFactory = (url: string) => EventSource;

export function subscribeToProject(
  projectId: string,
  onSnapshot: (envelope: SnapshotEnvelope) => void,
  onError: (error: Error) => void,
  eventSourceFactory: EventSourceFactory = (url) => new EventSource(url),
): () => void {
  const source = eventSourceFactory(`/api/stream?projectId=${encodeURIComponent(projectId)}`);
  const handleSnapshot = (event: MessageEvent<string>) => {
    try {
      onSnapshot(JSON.parse(event.data) as SnapshotEnvelope);
    } catch {
      onError(new Error("Invalid snapshot received from ledger stream"));
    }
  };
  const handleError = (event: Event) => {
    const data = "data" in event && typeof event.data === "string" ? event.data : "";
    if (data) {
      try {
        const payload = JSON.parse(data) as { message?: string };
        if (payload.message) {
          onError(new Error(payload.message));
          return;
        }
      } catch {
        // Native EventSource errors do not carry JSON data.
      }
    }
    onError(new Error("Ledger stream disconnected"));
  };

  source.addEventListener("ledger:snapshot", handleSnapshot);
  source.addEventListener("error", handleError);
  return () => {
    source.removeEventListener("ledger:snapshot", handleSnapshot);
    source.removeEventListener("error", handleError);
    source.close();
  };
}
