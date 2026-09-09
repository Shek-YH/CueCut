import { expect, test } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const aggregate = {
  project: {
    schemaVersion: 1,
    projectId: "cuecut3-example",
    name: "CueCut3",
    rootPath: "F:\\CCPJ\\CueCut3",
    createdAt: "2026-09-08T12:00:00-04:00",
    updatedAt: "2026-09-08T13:38:22-04:00",
    phases: [{ id: "P02", name: "开发实现", order: 2 }],
  },
  projectId: "cuecut3-example",
  rootPath: "F:\\CCPJ\\CueCut3",
  summary: {
    total: 1,
    progress: 56,
    byStatus: { NOT_STARTED: 0, IN_PROGRESS: 1, BLOCKED: 0, WAITING_USER: 0, WAITING_REVIEW: 0, COMPLETED: 0, PAUSED: 0 },
  },
  phases: [{ id: "P02", name: "开发实现", order: 2, progress: 56, taskCount: 1 }],
  tasks: [{
    id: "T-021", phaseId: "P02", parentId: null, title: "Registry", description: "接入 Registry", status: "IN_PROGRESS", progress: 56, priority: "P0", roleId: "R01", agent: "Codex", sessionId: "session-021", dependsOn: [], blockedReason: null, waitingUserReason: null, startedAt: "2026-09-08T12:40:00-04:00", updatedAt: "2026-09-08T13:38:22-04:00", completedAt: null, artifacts: [], children: [],
  }],
  taskTree: [{
    id: "T-021", phaseId: "P02", parentId: null, title: "Registry", description: "接入 Registry", status: "IN_PROGRESS", progress: 56, priority: "P0", roleId: "R01", agent: "Codex", sessionId: "session-021", dependsOn: [], blockedReason: null, waitingUserReason: null, startedAt: "2026-09-08T12:40:00-04:00", updatedAt: "2026-09-08T13:38:22-04:00", completedAt: null, artifacts: [], children: [],
  }],
  roles: [{ id: "R01", name: "Motion Architecture", agent: "Codex" }],
  sessions: [],
  artifacts: [{ id: "A-008", taskId: "T-021", type: "source", path: "src/motions/registry/index.ts", exists: true, updatedAt: "2026-09-08T13:35:12-04:00" }],
  runtime: { schemaVersion: 1, projectId: "cuecut3-example", ledgerWriter: "ledger", active: true, currentTaskIds: ["T-021"], lastWriteAt: "2026-09-08T13:38:22-04:00" },
  events: [],
  recentEvents: [],
};

test("loads the dashboard from an aggregate snapshot and navigates to Tasks", async ({ page }) => {
  let snapshotRequests = 0;
  await page.route("**/api/projects", (route) => route.fulfill({ json: { projects: [{ projectId: "cuecut3-example", name: "CueCut3", rootPath: "F:\\CCPJ\\CueCut3" }] } }));
  await page.route("**/api/projects/cuecut3-example/snapshot", (route) => {
    snapshotRequests += 1;
    return route.fulfill({ json: { snapshot: aggregate, warning: null, usedLastKnownGood: false } });
  });
  await page.route("**/api/stream?projectId=cuecut3-example", (route) => route.fulfill({ status: 200, contentType: "text/event-stream", body: "" }));
  await page.route("**/api/projects/cuecut3-example/artifacts/open", async (route) => {
    expect(route.request().method()).toBe("POST");
    expect(route.request().postDataJSON()).toEqual({ path: "src/motions/registry/index.ts" });
    await route.fulfill({ json: { ok: true } });
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "CueCut3" })).toBeVisible();
  expect(snapshotRequests).toBe(1);
  const completion = page.getByRole("progressbar", { name: "项目完成度" });
  await expect(completion).toBeVisible();
  await expect(completion).toContainText("56%");
  await expect(completion).toHaveAttribute("aria-valuenow", "56");
  await page.getByRole("button", { name: "任务" }).click();
  await expect(page.getByTestId("task-card-T-021")).toBeVisible();
  await expect(page.getByText("只读", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "产物" }).click();
  await page.getByRole("button", { name: "打开所在文件夹" }).click();
  await expect(page.getByRole("status")).toContainText("所在文件夹已打开");
});

test("adds a real project folder through the localhost API", async ({ page }) => {
  const projectRoot = await mkdtemp(path.join(tmpdir(), "wi-012-e2e-"));

  try {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "总览" })).toBeVisible();
    await page.getByRole("button", { name: "设置" }).click();

    const postResponsePromise = page.waitForResponse((response) => (
      response.url().endsWith("/api/projects") && response.request().method() === "POST"
    ));
    const refreshResponsePromise = page.waitForResponse((response) => (
      response.url().endsWith("/api/projects") && response.request().method() === "GET"
    ));
    const snapshotResponsePromise = page.waitForResponse((response) => (
      response.url().endsWith("/snapshot") && response.request().method() === "GET"
    ));

    await page.getByRole("textbox", { name: "项目根目录" }).fill(projectRoot);
    await page.getByRole("button", { name: "添加项目文件夹" }).click();

    const postResponse = await postResponsePromise;
    expect(postResponse.status()).toBe(201);
    expect(await postResponse.json()).toMatchObject({
      ok: true,
      kind: "initialized",
      project: { rootPath: path.resolve(projectRoot) },
    });
    await refreshResponsePromise;
    await snapshotResponsePromise;
    await expect(page.getByRole("status")).toContainText("项目已登记");
    await expect(page.getByRole("status")).toContainText("已初始化空台账");
    await expect(page.getByText(path.resolve(projectRoot), { exact: true })).toBeVisible();
  } finally {
    await rm(projectRoot, { recursive: true, force: true });
  }
});
