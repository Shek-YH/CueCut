import {
  calculatePhaseProgress,
  buildPhaseSummaries,
  TaskStatus,
} from "../../packages/ledger-schema/src/index.js";

const phases = [
  { id: "P01", name: "Analysis", order: 1 },
  { id: "P02", name: "Build", order: 2 },
];

const tasks = [
  { id: "T-1", phaseId: "P01", status: TaskStatus.COMPLETED, progress: 100, children: [] },
  { id: "T-2", phaseId: "P01", status: TaskStatus.IN_PROGRESS, progress: 40, children: [] },
  { id: "T-3", phaseId: "P02", status: TaskStatus.NOT_STARTED, progress: 0, children: [] },
];

describe("phase progress and summaries", () => {
  it("averages leaf tasks belonging to one phase", () => {
    expect(calculatePhaseProgress("P01", tasks)).toBe(70);
  });

  it("returns ordered phase summaries with counts and progress", () => {
    expect(buildPhaseSummaries(phases, tasks)).toEqual([
      {
        id: "P01",
        name: "Analysis",
        order: 1,
        progress: 70,
        taskCount: 2,
      },
      {
        id: "P02",
        name: "Build",
        order: 2,
        progress: 0,
        taskCount: 1,
      },
    ]);
  });
});
