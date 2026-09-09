import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  ArtifactFileSchema,
  EventSchema,
  ProjectFileSchema,
  RoleFileSchema,
  RuntimeSchema,
  SessionFileSchema,
  TaskFileSchema,
  TaskSchema,
  TaskStatusSchema,
} from "../../packages/ledger-schema/src/index.js";

const root = resolve(import.meta.dirname, "../..");

function readJson(relativePath: string): unknown {
  return JSON.parse(readFileSync(resolve(root, relativePath), "utf8"));
}

describe("machine ledger schemas", () => {
  it("accepts the existing project and sample ledger fixtures", () => {
    const ledgerPaths = [
      ".ai-ledger/project.json",
      ".ai-ledger/tasks.json",
      ".ai-ledger/roles.json",
      ".ai-ledger/sessions.json",
      ".ai-ledger/artifacts.json",
      ".ai-ledger/runtime.json",
    ];

    for (const prefix of ["", "fixtures/sample-project/"]) {
      expect(ProjectFileSchema.parse(readJson(`${prefix}.ai-ledger/project.json`))).toBeDefined();
      expect(TaskFileSchema.parse(readJson(`${prefix}.ai-ledger/tasks.json`))).toBeDefined();
      expect(RoleFileSchema.parse(readJson(`${prefix}.ai-ledger/roles.json`))).toBeDefined();
      expect(SessionFileSchema.parse(readJson(`${prefix}.ai-ledger/sessions.json`))).toBeDefined();
      expect(ArtifactFileSchema.parse(readJson(`${prefix}.ai-ledger/artifacts.json`))).toBeDefined();
      expect(RuntimeSchema.parse(readJson(`${prefix}.ai-ledger/runtime.json`))).toBeDefined();
    }

    expect(ledgerPaths).toHaveLength(6);
  });

  it("exposes exactly the seven machine task statuses", () => {
    expect(TaskStatusSchema.options).toEqual([
      "NOT_STARTED",
      "IN_PROGRESS",
      "BLOCKED",
      "WAITING_USER",
      "WAITING_REVIEW",
      "COMPLETED",
      "PAUSED",
    ]);
  });

  it("requires completed tasks to be 100% and timestamped", () => {
    const task = {
      id: "T-001",
      phaseId: "P01",
      parentId: null,
      title: "Complete",
      description: "A task",
      status: "COMPLETED",
      progress: 99,
      priority: "P0",
      roleId: "R01",
      agent: "codex",
      sessionId: null,
      dependsOn: [],
      blockedReason: null,
      waitingUserReason: null,
      startedAt: null,
      updatedAt: "2026-09-08T13:38:22-04:00",
      completedAt: null,
      artifacts: [],
      children: [],
    };

    expect(TaskSchema.safeParse(task).success).toBe(false);
    expect(
      TaskSchema.safeParse({
        ...task,
        progress: 100,
        completedAt: "2026-09-08T13:38:22-04:00",
      }).success,
    ).toBe(true);
  });

  it.each([
    ["BLOCKED", "blockedReason"],
    ["WAITING_USER", "waitingUserReason"],
  ] as const)("requires %s tasks to carry %s", (status, reasonField) => {
    const task = {
      id: "T-002",
      phaseId: "P01",
      parentId: null,
      title: "Waiting task",
      description: "A task",
      status,
      progress: 35,
      priority: "P0",
      roleId: "R01",
      agent: "codex",
      sessionId: null,
      dependsOn: [],
      blockedReason: null,
      waitingUserReason: null,
      startedAt: null,
      updatedAt: "2026-09-08T13:38:22-04:00",
      completedAt: null,
      artifacts: [],
      children: [],
    };

    expect(TaskSchema.safeParse(task).success).toBe(false);
    expect(
      TaskSchema.safeParse({ ...task, [reasonField]: "A concrete reason" }).success,
    ).toBe(true);
  });

  it("rejects progress outside the inclusive 0-100 range", () => {
    const result = TaskSchema.safeParse({
      id: "T-003",
      phaseId: "P01",
      parentId: null,
      title: "Invalid progress",
      description: "A task",
      status: "IN_PROGRESS",
      progress: 101,
      priority: "P0",
      roleId: null,
      agent: "codex",
      sessionId: null,
      dependsOn: [],
      blockedReason: null,
      waitingUserReason: null,
      startedAt: null,
      updatedAt: "2026-09-08T13:38:22-04:00",
      completedAt: null,
      artifacts: [],
      children: [],
    });

    expect(result.success).toBe(false);
  });

  it("parses the runtime and event contracts without treating sessionId as projectId", () => {
    const runtime = RuntimeSchema.parse(readJson("fixtures/sample-project/.ai-ledger/runtime.json"));
    const event = EventSchema.parse({
      eventId: "evt-100",
      ts: "2026-09-08T13:38:22-04:00",
      type: "TASK_STATUS_CHANGED",
      taskId: "T-002",
      from: "NOT_STARTED",
      to: "IN_PROGRESS",
      actor: "codex",
      sessionId: "session-002",
    });

    expect(runtime.projectId).toBe("cuecut3-example");
    expect(event.sessionId).toBe("session-002");
    expect("projectId" in event).toBe(false);
  });
});
