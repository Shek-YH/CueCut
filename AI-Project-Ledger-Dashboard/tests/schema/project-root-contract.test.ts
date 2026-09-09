import {
  assertProjectRootContract,
  ProjectFileSchema,
  RuntimeSchema,
  TaskFileSchema,
} from "../../packages/ledger-schema/src/index.js";

const project = ProjectFileSchema.parse({
  schemaVersion: 1,
  projectId: "demo-project",
  name: "Demo",
  rootPath: "F:\\Projects\\Demo",
  createdAt: "2026-09-08T13:30:00-04:00",
  updatedAt: "2026-09-08T13:38:22-04:00",
  phases: [],
});

const tasks = TaskFileSchema.parse({
  schemaVersion: 1,
  projectId: "demo-project",
  updatedAt: "2026-09-08T13:38:22-04:00",
  tasks: [],
});

const runtime = RuntimeSchema.parse({
  schemaVersion: 1,
  projectId: "demo-project",
  ledgerWriter: "AI_Autonomous_Project_Ledger_Skill_v1",
  active: true,
  currentTaskIds: [],
  lastWriteAt: "2026-09-08T13:38:22-04:00",
});

describe("project root contract", () => {
  it("binds task and runtime ledgers to the project root identity", () => {
    expect(
      assertProjectRootContract({
        project,
        tasks,
        runtime,
        expectedRootPath: "F:/Projects/Demo/",
      }),
    ).toEqual({ projectId: "demo-project", rootPath: "F:/Projects/Demo" });
  });

  it("rejects a task ledger whose projectId does not match project.json", () => {
    expect(() =>
      assertProjectRootContract({
        project,
        tasks: { ...tasks, projectId: "session-001" },
        runtime,
      }),
    ).toThrow(/projectId/i);
  });

  it("rejects a session id being reused as the project identity", () => {
    expect(() =>
      assertProjectRootContract({
        project,
        tasks,
        runtime,
        sessions: [{ id: "demo-project" }],
      }),
    ).toThrow(/session/i);
  });
});
