import { afterEach, describe, expect, it, vi } from "vitest";
import * as dataClient from "../../web/data.js";
import { fetchProjectSnapshot, subscribeToProject } from "../../web/data.js";
import type { SnapshotEnvelope } from "../../web/types.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("dashboard snapshot client", () => {
  it("posts only rootPath and returns the WI-011 bootstrap result", async () => {
    const addProject = (dataClient as typeof dataClient & {
      addProject?: (rootPath: string) => Promise<unknown>;
    }).addProject;
    expect(addProject).toBeTypeOf("function");
    if (!addProject) return;

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        ok: true,
        kind: "initialized",
        project: { projectId: "new-project", name: "New Project", rootPath: "C:\\tmp\\new-project" },
        warnings: [],
        legacyFiles: [],
      }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await addProject("C:\\tmp\\new-project");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/projects",
      expect.objectContaining({
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rootPath: "C:\\tmp\\new-project" }),
      }),
    );
  });

  it("surfaces the stable add-project backend error", async () => {
    const addProject = (dataClient as typeof dataClient & {
      addProject?: (rootPath: string) => Promise<unknown>;
    }).addProject;
    expect(addProject).toBeTypeOf("function");
    if (!addProject) return;

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "Project root directory is invalid" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    ));

    await expect(addProject("C:\\missing")).rejects.toThrow("Project root directory is invalid");
  });

  it("requests exactly one aggregate snapshot endpoint for a project", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ snapshot: { projectId: "cuecut3-example" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchProjectSnapshot("cuecut3-example");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/projects/cuecut3-example/snapshot",
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
    expect(result.snapshot?.projectId).toBe("cuecut3-example");
  });

  it("surfaces the structured warning from an SSE error frame", () => {
    type Listener = (event: Event) => void;
    class FakeEventSource {
      public readonly listeners = new Map<string, Listener[]>();
      public closed = false;

      public constructor(public readonly url: string) {}

      public addEventListener(type: string, listener: Listener): void {
        this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
      }

      public removeEventListener(type: string, listener: Listener): void {
        this.listeners.set(type, (this.listeners.get(type) ?? []).filter((candidate) => candidate !== listener));
      }

      public close(): void { this.closed = true; }

      public emit(type: string, data: string): void {
        const event = Object.assign(new Event(type), { data });
        for (const listener of this.listeners.get(type) ?? []) listener(event);
      }
    }

    const source = new FakeEventSource("unused");
    let errorMessage = "";
    const unsubscribe = subscribeToProject(
      "cuecut3-example",
      (_envelope: SnapshotEnvelope) => undefined,
      (error) => { errorMessage = error.message; },
      () => source as unknown as EventSource,
    );

    source.emit("error", JSON.stringify({ code: "INVALID_LEDGER", message: "Invalid schema in tasks.json" }));

    expect(errorMessage).toBe("Invalid schema in tasks.json");
    unsubscribe();
    expect(source.closed).toBe(true);
  });
});
