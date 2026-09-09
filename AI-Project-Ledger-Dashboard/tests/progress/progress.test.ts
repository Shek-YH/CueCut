import {
  calculateParentProgress,
  deriveTaskProgress,
  summarizeTasks,
  TaskStatus,
} from "../../packages/ledger-schema/src/index.js";

describe("pure task progress", () => {
  it("derives a parent percentage from child progress with equal weights", () => {
    expect(
      calculateParentProgress([
        { status: TaskStatus.COMPLETED, progress: 100 },
        { status: TaskStatus.IN_PROGRESS, progress: 40 },
        { status: TaskStatus.BLOCKED, progress: 20 },
      ]),
    ).toBe(53);
  });

  it("uses explicit child progress before status fallback and supports weights", () => {
    expect(
      calculateParentProgress([
        { status: TaskStatus.COMPLETED, progress: 100, weight: 2 },
        { status: TaskStatus.WAITING_REVIEW, weight: 1 },
      ]),
    ).toBe(97);
  });

  it("uses the PRD fallback of 90% for WAITING_REVIEW without explicit progress", () => {
    expect(
      calculateParentProgress([{ status: TaskStatus.WAITING_REVIEW }]),
    ).toBe(90);
  });

  it("derives a parent task from its referenced children", () => {
    const parent = {
      id: "T-parent",
      status: TaskStatus.IN_PROGRESS,
      progress: 0,
      children: ["T-1", "T-2"],
    };
    const children = [
      { id: "T-1", status: TaskStatus.COMPLETED, progress: 100 },
      { id: "T-2", status: TaskStatus.IN_PROGRESS, progress: 50 },
    ];

    expect(deriveTaskProgress(parent, children)).toBe(75);
  });

  it("summarizes leaf task statuses and project progress", () => {
    const summary = summarizeTasks([
      { id: "parent", status: TaskStatus.IN_PROGRESS, progress: 0, children: ["done"] },
      { id: "done", status: TaskStatus.COMPLETED, progress: 100, children: [] },
      { id: "blocked", status: TaskStatus.BLOCKED, progress: 30, children: [] },
      { id: "waiting", status: TaskStatus.WAITING_USER, progress: 20, children: [] },
    ]);

    expect(summary.total).toBe(3);
    expect(summary.progress).toBe(50);
    expect(summary.byStatus.COMPLETED).toBe(1);
    expect(summary.byStatus.BLOCKED).toBe(1);
    expect(summary.byStatus.WAITING_USER).toBe(1);
  });
});
