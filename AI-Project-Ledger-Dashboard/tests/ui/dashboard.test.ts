// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createElement, StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DashboardApp } from "../../web/App.js";
import type { DashboardSnapshot, SnapshotEnvelope } from "../../web/types.js";

const snapshot: DashboardSnapshot = {
  project: {
    schemaVersion: 1,
    projectId: "cuecut3-example",
    name: "CueCut3",
    rootPath: "F:\\CCPJ\\CueCut3",
    createdAt: "2026-09-08T12:00:00-04:00",
    updatedAt: "2026-09-08T13:38:22-04:00",
    phases: [
      { id: "P01", name: "项目分析", order: 1 },
      { id: "P02", name: "开发实现", order: 2 },
      { id: "P03", name: "测试验收", order: 3 },
    ],
  },
  projectId: "cuecut3-example",
  rootPath: "F:\\CCPJ\\CueCut3",
  summary: {
    total: 4,
    progress: 72,
    byStatus: {
      NOT_STARTED: 0,
      IN_PROGRESS: 1,
      BLOCKED: 1,
      WAITING_USER: 1,
      WAITING_REVIEW: 0,
      COMPLETED: 1,
      PAUSED: 0,
    },
  },
  phases: [
    { id: "P01", name: "项目分析", order: 1, progress: 100, taskCount: 1 },
    { id: "P02", name: "开发实现", order: 2, progress: 46, taskCount: 2 },
    { id: "P03", name: "测试验收", order: 3, progress: 0, taskCount: 1 },
  ],
  tasks: [
    {
      id: "T-020",
      phaseId: "P02",
      parentId: null,
      title: "导入基础动效",
      description: "导入并校验动效。",
      status: "COMPLETED",
      progress: 100,
      priority: "P0",
      roleId: "R01",
      agent: "Codex",
      sessionId: "session-020",
      dependsOn: [],
      blockedReason: null,
      waitingUserReason: null,
      startedAt: "2026-09-08T12:00:00-04:00",
      updatedAt: "2026-09-08T12:30:00-04:00",
      completedAt: "2026-09-08T12:30:00-04:00",
      artifacts: ["docs/motion.md"],
      children: [],
    },
    {
      id: "T-021",
      phaseId: "P02",
      parentId: null,
      title: "Registry",
      description: "接入 Effect Registry。",
      status: "IN_PROGRESS",
      progress: 56,
      priority: "P0",
      roleId: "R01",
      agent: "Codex",
      sessionId: "session-021",
      dependsOn: ["T-020"],
      blockedReason: null,
      waitingUserReason: null,
      startedAt: "2026-09-08T12:40:00-04:00",
      updatedAt: "2026-09-08T13:38:22-04:00",
      completedAt: null,
      artifacts: ["src/motions/registry/index.ts"],
      children: ["T-021-01"],
    },
    {
      id: "T-022",
      phaseId: "P02",
      parentId: null,
      title: "Renderer Export",
      description: "检查 export renderer 兼容。",
      status: "BLOCKED",
      progress: 35,
      priority: "P0",
      roleId: "R03",
      agent: "Codex",
      sessionId: "session-022",
      dependsOn: ["T-021"],
      blockedReason: "motion/react export renderer 不兼容",
      waitingUserReason: null,
      startedAt: "2026-09-08T13:00:00-04:00",
      updatedAt: "2026-09-08T13:35:00-04:00",
      completedAt: null,
      artifacts: [],
      children: [],
    },
    {
      id: "T-023",
      phaseId: "P03",
      parentId: null,
      title: "真实素材验证",
      description: "等待真实素材。",
      status: "WAITING_USER",
      progress: 0,
      priority: "P1",
      roleId: "R06",
      agent: "Codex",
      sessionId: null,
      dependsOn: ["T-022"],
      blockedReason: null,
      waitingUserReason: "需要 9:16 口播视频和 SRT",
      startedAt: null,
      updatedAt: "2026-09-08T13:36:00-04:00",
      completedAt: null,
      artifacts: [],
      children: [],
    },
  ],
  taskTree: [
    {
      id: "T-020",
      phaseId: "P02",
      parentId: null,
      title: "导入基础动效",
      description: "导入并校验动效。",
      status: "COMPLETED",
      progress: 100,
      priority: "P0",
      roleId: "R01",
      agent: "Codex",
      sessionId: "session-020",
      dependsOn: [],
      blockedReason: null,
      waitingUserReason: null,
      startedAt: "2026-09-08T12:00:00-04:00",
      updatedAt: "2026-09-08T12:30:00-04:00",
      completedAt: "2026-09-08T12:30:00-04:00",
      artifacts: ["docs/motion.md"],
      children: [],
    },
    {
      id: "T-021",
      phaseId: "P02",
      parentId: null,
      title: "Registry",
      description: "接入 Effect Registry。",
      status: "IN_PROGRESS",
      progress: 56,
      priority: "P0",
      roleId: "R01",
      agent: "Codex",
      sessionId: "session-021",
      dependsOn: ["T-020"],
      blockedReason: null,
      waitingUserReason: null,
      startedAt: "2026-09-08T12:40:00-04:00",
      updatedAt: "2026-09-08T13:38:22-04:00",
      completedAt: null,
      artifacts: ["src/motions/registry/index.ts"],
      children: [
        {
          id: "T-021-01",
          phaseId: "P02",
          parentId: "T-021",
          title: "类型",
          description: "完善类型。",
          status: "COMPLETED",
          progress: 100,
          priority: "P0",
          roleId: "R01",
          agent: "Codex",
          sessionId: "session-021",
          dependsOn: [],
          blockedReason: null,
          waitingUserReason: null,
          startedAt: "2026-09-08T12:40:00-04:00",
          updatedAt: "2026-09-08T13:10:00-04:00",
          completedAt: "2026-09-08T13:10:00-04:00",
          artifacts: [],
          children: [],
        },
      ],
    },
    {
      id: "T-022",
      phaseId: "P02",
      parentId: null,
      title: "Renderer Export",
      description: "检查 export renderer 兼容。",
      status: "BLOCKED",
      progress: 35,
      priority: "P0",
      roleId: "R03",
      agent: "Codex",
      sessionId: "session-022",
      dependsOn: ["T-021"],
      blockedReason: "motion/react export renderer 不兼容",
      waitingUserReason: null,
      startedAt: "2026-09-08T13:00:00-04:00",
      updatedAt: "2026-09-08T13:35:00-04:00",
      completedAt: null,
      artifacts: [],
      children: [],
    },
    {
      id: "T-023",
      phaseId: "P03",
      parentId: null,
      title: "真实素材验证",
      description: "等待真实素材。",
      status: "WAITING_USER",
      progress: 0,
      priority: "P1",
      roleId: "R06",
      agent: "Codex",
      sessionId: null,
      dependsOn: ["T-022"],
      blockedReason: null,
      waitingUserReason: "需要 9:16 口播视频和 SRT",
      startedAt: null,
      updatedAt: "2026-09-08T13:36:00-04:00",
      completedAt: null,
      artifacts: [],
      children: [],
    },
  ],
  roles: [
    { id: "R01", name: "Motion Architecture", agent: "Codex" },
    { id: "R03", name: "Renderer", agent: "Codex" },
    { id: "R06", name: "QA", agent: "Codex" },
  ],
  sessions: [
    {
      id: "session-021",
      provider: "Codex",
      roleId: "R01",
      status: "ACTIVE",
      startedAt: "2026-09-08T12:40:00-04:00",
      lastSeenAt: "2026-09-08T13:38:00-04:00",
      taskIds: ["T-021"],
    },
  ],
  artifacts: [
    {
      id: "A-008",
      taskId: "T-021",
      type: "source",
      path: "src/motions/registry/index.ts",
      exists: true,
      updatedAt: "2026-09-08T13:35:12-04:00",
    },
  ],
  runtime: {
    schemaVersion: 1,
    projectId: "cuecut3-example",
    ledgerWriter: "AI_Autonomous_Project_Ledger_Skill_v1",
    active: true,
    currentTaskIds: ["T-021"],
    lastWriteAt: "2026-09-08T13:38:22-04:00",
  },
  events: [
    {
      eventId: "evt-001",
      ts: "2026-09-08T13:38:00-04:00",
      type: "TASK_STATUS_CHANGED",
      actor: "Codex",
      taskId: "T-021",
      from: "NOT_STARTED",
      to: "IN_PROGRESS",
    },
    {
      eventId: "evt-002",
      ts: "2026-09-08T13:21:00-04:00",
      type: "ARTIFACT_CREATED",
      actor: "Codex",
      artifactId: "A-008",
      path: "src/motions/registry/index.ts",
    },
  ],
  recentEvents: [],
};

afterEach(() => {
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
});

describe("dashboard UX", () => {
  const useEnglishLabels = () => fireEvent.click(screen.getByRole("button", { name: "切换到英文" }));

  it("loads one snapshot for the same project under StrictMode and cancels it on unmount", async () => {
    const signals: AbortSignal[] = [];
    let resolveSnapshot: ((envelope: SnapshotEnvelope) => void) | undefined;
    const snapshotLoader = vi.fn((_projectId: string, signal?: AbortSignal) => {
      signals.push(signal!);
      return new Promise<SnapshotEnvelope>((resolve) => {
        resolveSnapshot = resolve;
      });
    });

    const { unmount } = render(
      createElement(
        StrictMode,
        null,
        createElement(DashboardApp, {
          projectId: "cuecut3-example",
          snapshotLoader,
        }),
      ),
    );

    expect(snapshotLoader).toHaveBeenCalledTimes(1);
    expect(signals).toHaveLength(1);

    unmount();
    await Promise.resolve();

    expect(signals[0].aborted).toBe(true);
    resolveSnapshot?.({ snapshot, warning: null, usedLastKnownGood: false });
  });

  it("renders overview metrics, project state and phase progress from one snapshot", () => {
    render(createElement(DashboardApp, { initialSnapshot: snapshot }));
    useEnglishLabels();

    expect(screen.getByRole("heading", { name: "CueCut3" })).toBeDefined();
    const completion = screen.getByRole("progressbar", { name: "Project completion" });
    expect(within(completion).getByText("72%")).toBeDefined();
    expect(completion.getAttribute("aria-valuenow")).toBe("72");
    expect(screen.getByText("Complete")).toBeDefined();
    expect(screen.getByText("Ledger Active")).toBeDefined();
    expect(screen.getByText("项目分析")).toBeDefined();
    expect(screen.getByText("开发实现")).toBeDefined();
    expect(screen.getByRole("navigation")).toBeDefined();
  });

  it("defaults to Chinese and can toggle the complete dashboard to English", () => {
    render(createElement(DashboardApp, { initialSnapshot: snapshot }));

    expect(screen.getByRole("heading", { name: "总览" })).toBeDefined();
    expect(screen.getByText("项目总览")).toBeDefined();
    expect(screen.getByRole("button", { name: "切换到英文" })).toBeDefined();
    expect(screen.queryByText("Project Overview")).toBeNull();

    for (const view of ["任务", "阻塞项", "活动", "角色", "产物", "设置"]) {
      fireEvent.click(screen.getByRole("button", { name: view }));
      expect(screen.getAllByRole("heading", { name: view })[0]).toBeDefined();
    }
    fireEvent.click(screen.getByRole("button", { name: "总览" }));

    fireEvent.click(screen.getByRole("button", { name: "切换到英文" }));

    expect(screen.getByRole("heading", { name: "Overview" })).toBeDefined();
    expect(screen.getByText("Project Overview")).toBeDefined();
    expect(screen.getByRole("button", { name: "切换到中文" })).toBeDefined();
  });

  it("filters the task tree by status, role, priority and search", () => {
    render(createElement(DashboardApp, { initialSnapshot: snapshot }));
    useEnglishLabels();
    fireEvent.click(screen.getByRole("button", { name: "Tasks" }));

    const taskCard = screen.getByTestId("task-card-T-022");
    expect(within(taskCard).getByText("Blocked")).toBeDefined();
    expect(within(taskCard).getByLabelText("Status icon: BLOCKED")).toBeDefined();
    expect(taskCard.querySelector('[data-testid="status-bar"]')?.getAttribute("data-color")).toBe(
      "#ef4444",
    );

    fireEvent.change(screen.getByRole("combobox", { name: "Status" }), {
      target: { value: "WAITING_USER" },
    });
    expect(screen.getByTestId("task-card-T-023")).toBeDefined();
    expect(screen.queryByTestId("task-card-T-022")).toBeNull();

    fireEvent.change(screen.getByRole("combobox", { name: "Roles" }), {
      target: { value: "R06" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Priority" }), {
      target: { value: "P1" },
    });
    fireEvent.change(screen.getByRole("searchbox", { name: "Search tasks" }), {
      target: { value: "素材" },
    });
    expect(screen.getByTestId("task-card-T-023")).toBeDefined();
  });

  it("keeps BLOCKED and WAITING_USER in separate blocker sections", () => {
    render(createElement(DashboardApp, { initialSnapshot: snapshot }));
    useEnglishLabels();
    fireEvent.click(screen.getByRole("button", { name: "Blockers" }));

    const blocked = screen.getByRole("region", { name: "Blocked" });
    const waiting = screen.getByRole("region", { name: "Waiting User" });
    expect(within(blocked).getByText("Renderer Export")).toBeDefined();
    expect(within(blocked).getByText("motion/react export renderer 不兼容")).toBeDefined();
    expect(within(waiting).getByText("真实素材验证")).toBeDefined();
    expect(within(waiting).getByText("需要 9:16 口播视频和 SRT")).toBeDefined();
    expect(within(blocked).queryByText("真实素材验证")).toBeNull();
    expect(within(waiting).queryByText("Renderer Export")).toBeNull();
  });

  it("renders activity, roles, artifacts and read-only settings", () => {
    render(createElement(DashboardApp, { initialSnapshot: snapshot }));
    useEnglishLabels();

    fireEvent.click(screen.getByRole("button", { name: "Activity" }));
    expect(screen.getByText("TASK_STATUS_CHANGED")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Roles" }));
    expect(screen.getByText("Motion Architecture")).toBeDefined();
    expect(screen.getByText("Renderer")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Artifacts" }));
    expect(screen.getByText("src/motions/registry/index.ts")).toBeDefined();
    expect(screen.getByRole("button", { name: "Copy Path" })).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    expect(screen.getByText("Read-only project state")).toBeDefined();
    expect(screen.getByRole("button", { name: "Add Project Folder" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Remove from Dashboard" })).toBeDefined();
    expect(screen.queryByRole("button", { name: /update task status/i })).toBeNull();
    expect(screen.queryByLabelText(/task status|progress|role|session/i)).toBeNull();
    expect(screen.queryByRole("button", { name: /set progress|assign role|session/i })).toBeNull();
  });

  it("adds a project from an accessible root input and switches to its snapshot", async () => {
    const addedSnapshot = {
      ...snapshot,
      project: { ...snapshot.project, projectId: "new-project", name: "New Project", rootPath: "C:\\tmp\\new-project" },
      projectId: "new-project",
      rootPath: "C:\\tmp\\new-project",
      runtime: { ...snapshot.runtime, projectId: "new-project" },
    };
    const projectAdder = vi.fn().mockResolvedValue({
      ok: true,
      kind: "initialized",
      project: { projectId: "new-project", name: "New Project", rootPath: "C:\\tmp\\new-project" },
      warnings: [],
      legacyFiles: [],
    });
    const projectListLoader = vi.fn().mockResolvedValue([
      { projectId: "cuecut3-example", name: "CueCut3", rootPath: "F:\\CCPJ\\CueCut3" },
      { projectId: "new-project", name: "New Project", rootPath: "C:\\tmp\\new-project" },
    ]);
    const snapshotLoader = vi.fn().mockResolvedValue({ snapshot: addedSnapshot, warning: null, usedLastKnownGood: false });
    const eventSourceFactory = () => ({
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      close: () => undefined,
    } as unknown as EventSource);

    render(createElement(DashboardApp, {
      initialSnapshot: snapshot,
      projectAdder,
      projectListLoader,
      snapshotLoader,
      eventSourceFactory,
    }));
    useEnglishLabels();
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));

    const rootInput = screen.getByRole("textbox", { name: "Project root folder" });
    expect(rootInput).toBeDefined();
    fireEvent.change(rootInput, { target: { value: "C:\\tmp\\new-project" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Project Folder" }));

    await waitFor(() => expect(projectAdder).toHaveBeenCalledWith("C:\\tmp\\new-project"));
    await waitFor(() => expect(projectListLoader).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(snapshotLoader).toHaveBeenCalledWith("new-project", expect.any(AbortSignal)));
    expect(screen.getByRole("status").textContent).toContain("Project registered");
    expect(screen.getByRole("status").textContent).toContain("Empty ledger initialized");
    expect(screen.getAllByText("New Project")).toHaveLength(2);
    expect(screen.getByText("C:\\tmp\\new-project")).toBeDefined();
  });

  it("shows an add-project backend error without creating task-state controls", async () => {
    const projectAdder = vi.fn().mockRejectedValue(new Error("Project root directory is invalid"));
    render(createElement(DashboardApp, { initialSnapshot: snapshot, projectAdder }));
    useEnglishLabels();
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Project root folder" }), { target: { value: "C:\\missing" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Project Folder" }));

    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Project root directory is invalid"));
    expect(screen.queryByLabelText(/task status|progress|role|session/i)).toBeNull();
  });

  it("opens an artifact parent folder through the backend and reports success", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(createElement(DashboardApp, { initialSnapshot: snapshot }));
    useEnglishLabels();
    fireEvent.click(screen.getByRole("button", { name: "Artifacts" }));
    fireEvent.click(screen.getByRole("button", { name: "Open Parent Folder" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/projects/cuecut3-example/artifacts/open",
      expect.objectContaining({
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path: "src/motions/registry/index.ts" }),
      }),
    );
    expect(screen.getByRole("status").textContent).toContain("Parent folder opened");
  });

  it("shows the backend error when opening an artifact parent folder fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "Artifact path rejected" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(createElement(DashboardApp, { initialSnapshot: snapshot }));
    useEnglishLabels();
    fireEvent.click(screen.getByRole("button", { name: "Artifacts" }));
    fireEvent.click(screen.getByRole("button", { name: "Open Parent Folder" }));

    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Artifact path rejected"));
  });
});
