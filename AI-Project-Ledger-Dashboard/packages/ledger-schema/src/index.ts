import { z } from "zod";

const ISO_TIMESTAMP = z.string().datetime({ offset: true });
const NON_EMPTY_STRING = z.string().min(1);

const TASK_STATUS_VALUES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "BLOCKED",
  "WAITING_USER",
  "WAITING_REVIEW",
  "COMPLETED",
  "PAUSED",
] as const;

export const TaskStatus = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  BLOCKED: "BLOCKED",
  WAITING_USER: "WAITING_USER",
  WAITING_REVIEW: "WAITING_REVIEW",
  COMPLETED: "COMPLETED",
  PAUSED: "PAUSED",
} as const;

export const TaskStatusSchema = z.enum(TASK_STATUS_VALUES);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

const ProgressSchema = z.number().finite().min(0).max(100);
const NullableTimestampSchema = ISO_TIMESTAMP.nullable();

export const PhaseSchema = z.object({
  id: NON_EMPTY_STRING,
  name: NON_EMPTY_STRING,
  order: z.number().int(),
  locked: z.boolean().optional(),
});
export type Phase = z.infer<typeof PhaseSchema>;

export const ProjectFileSchema = z.object({
  schemaVersion: z.literal(1),
  projectId: NON_EMPTY_STRING,
  name: NON_EMPTY_STRING,
  rootPath: NON_EMPTY_STRING,
  createdAt: ISO_TIMESTAMP,
  updatedAt: ISO_TIMESTAMP,
  phases: z.array(PhaseSchema),
});
export type ProjectFile = z.infer<typeof ProjectFileSchema>;

export const TaskSchema = z
  .object({
    id: NON_EMPTY_STRING,
    phaseId: NON_EMPTY_STRING,
    parentId: NON_EMPTY_STRING.nullable(),
    title: NON_EMPTY_STRING,
    description: z.string(),
    status: TaskStatusSchema,
    progress: ProgressSchema,
    priority: NON_EMPTY_STRING,
    roleId: NON_EMPTY_STRING.nullable(),
    agent: NON_EMPTY_STRING,
    sessionId: NON_EMPTY_STRING.nullable(),
    dependsOn: z.array(NON_EMPTY_STRING),
    blockedReason: NON_EMPTY_STRING.nullable(),
    waitingUserReason: NON_EMPTY_STRING.nullable(),
    startedAt: NullableTimestampSchema,
    updatedAt: ISO_TIMESTAMP,
    completedAt: NullableTimestampSchema,
    artifacts: z.array(NON_EMPTY_STRING),
    children: z.array(NON_EMPTY_STRING),
    weight: z.number().finite().positive().optional(),
  })
  .superRefine((task, context) => {
    if (task.status === TaskStatus.COMPLETED) {
      if (task.progress !== 100) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["progress"],
          message: "COMPLETED tasks must have progress 100",
        });
      }
      if (task.completedAt === null) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["completedAt"],
          message: "COMPLETED tasks must have completedAt",
        });
      }
    }

    if (task.status === TaskStatus.BLOCKED && task.blockedReason === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["blockedReason"],
        message: "BLOCKED tasks must have blockedReason",
      });
    }

    if (task.status === TaskStatus.WAITING_USER && task.waitingUserReason === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["waitingUserReason"],
        message: "WAITING_USER tasks must have waitingUserReason",
      });
    }
  });
export type Task = z.infer<typeof TaskSchema>;

export const TaskFileSchema = z.object({
  schemaVersion: z.literal(1),
  projectId: NON_EMPTY_STRING,
  updatedAt: ISO_TIMESTAMP,
  tasks: z.array(TaskSchema),
});
export type TaskFile = z.infer<typeof TaskFileSchema>;

export const RoleSchema = z.object({
  id: NON_EMPTY_STRING,
  name: NON_EMPTY_STRING,
  agent: NON_EMPTY_STRING,
  description: z.string().optional(),
});
export type Role = z.infer<typeof RoleSchema>;

export const RoleFileSchema = z.object({
  schemaVersion: z.literal(1),
  roles: z.array(RoleSchema),
});
export type RoleFile = z.infer<typeof RoleFileSchema>;

export const SessionSchema = z.object({
  id: NON_EMPTY_STRING,
  provider: NON_EMPTY_STRING,
  roleId: NON_EMPTY_STRING.nullable().optional(),
  status: NON_EMPTY_STRING,
  startedAt: ISO_TIMESTAMP,
  lastSeenAt: ISO_TIMESTAMP,
  taskIds: z.array(NON_EMPTY_STRING),
});
export type Session = z.infer<typeof SessionSchema>;

export const SessionFileSchema = z.object({
  schemaVersion: z.literal(1),
  sessions: z.array(SessionSchema),
});
export type SessionFile = z.infer<typeof SessionFileSchema>;

export const ArtifactSchema = z.object({
  id: NON_EMPTY_STRING,
  taskId: NON_EMPTY_STRING,
  type: NON_EMPTY_STRING,
  path: NON_EMPTY_STRING,
  exists: z.boolean(),
  updatedAt: ISO_TIMESTAMP,
});
export type Artifact = z.infer<typeof ArtifactSchema>;

export const ArtifactFileSchema = z.object({
  schemaVersion: z.literal(1),
  artifacts: z.array(ArtifactSchema),
});
export type ArtifactFile = z.infer<typeof ArtifactFileSchema>;

export const RuntimeSchema = z.object({
  schemaVersion: z.literal(1),
  projectId: NON_EMPTY_STRING,
  ledgerWriter: NON_EMPTY_STRING,
  active: z.boolean(),
  currentTaskIds: z.array(NON_EMPTY_STRING),
  lastWriteAt: ISO_TIMESTAMP,
});
export const RuntimeFileSchema = RuntimeSchema;
export type Runtime = z.infer<typeof RuntimeSchema>;

export const EventTypeSchema = z.enum([
  "PROJECT_CREATED",
  "TASK_CREATED",
  "TASK_UPDATED",
  "TASK_STATUS_CHANGED",
  "TASK_PROGRESS_CHANGED",
  "TASK_BLOCKED",
  "TASK_UNBLOCKED",
  "WAITING_USER",
  "USER_INPUT_RECEIVED",
  "TASK_COMPLETED",
  "ROLE_ASSIGNED",
  "SESSION_STARTED",
  "SESSION_ENDED",
  "ARTIFACT_CREATED",
  "ARTIFACT_UPDATED",
  "TEST_STARTED",
  "TEST_PASSED",
  "TEST_FAILED",
]);
export type EventType = z.infer<typeof EventTypeSchema>;

const EventValueSchema = z.union([TaskStatusSchema, z.number().finite().min(0).max(100)]);

export const EventSchema = z
  .object({
    eventId: NON_EMPTY_STRING,
    ts: ISO_TIMESTAMP,
    type: EventTypeSchema,
    actor: NON_EMPTY_STRING,
    sessionId: NON_EMPTY_STRING.nullable().optional(),
    taskId: NON_EMPTY_STRING.optional(),
    from: EventValueSchema.optional(),
    to: EventValueSchema.optional(),
    artifactId: NON_EMPTY_STRING.optional(),
    roleId: NON_EMPTY_STRING.optional(),
    reason: NON_EMPTY_STRING.optional(),
    path: NON_EMPTY_STRING.optional(),
  })
  .superRefine((event, context) => {
    const taskEvents: EventType[] = [
      "TASK_CREATED",
      "TASK_UPDATED",
      "TASK_STATUS_CHANGED",
      "TASK_PROGRESS_CHANGED",
      "TASK_BLOCKED",
      "TASK_UNBLOCKED",
      "WAITING_USER",
      "TASK_COMPLETED",
    ];

    if (taskEvents.includes(event.type) && event.taskId === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["taskId"],
        message: `${event.type} events require taskId`,
      });
    }

    if (event.type === "TASK_STATUS_CHANGED") {
      if (typeof event.from !== "string" || typeof event.to !== "string") {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["from", "to"],
          message: "TASK_STATUS_CHANGED events require status from and to",
        });
      }
    }

    if (event.type === "TASK_PROGRESS_CHANGED") {
      if (typeof event.from !== "number" || typeof event.to !== "number") {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["from", "to"],
          message: "TASK_PROGRESS_CHANGED events require numeric from and to",
        });
      }
    }
  });
export type LedgerEvent = z.infer<typeof EventSchema>;

export type ProgressInput = {
  status: TaskStatus;
  progress?: number;
  weight?: number;
};

const FALLBACK_PROGRESS: Record<TaskStatus, number> = {
  NOT_STARTED: 0,
  IN_PROGRESS: 50,
  BLOCKED: 0,
  WAITING_USER: 0,
  WAITING_REVIEW: 90,
  COMPLETED: 100,
  PAUSED: 0,
};

function progressFor(task: ProgressInput): number {
  return task.progress !== undefined ? task.progress : FALLBACK_PROGRESS[task.status];
}

function weightFor(task: ProgressInput): number {
  return task.weight !== undefined && Number.isFinite(task.weight) && task.weight > 0
    ? task.weight
    : 1;
}

export function calculateParentProgress(children: ProgressInput[]): number {
  if (children.length === 0) {
    return 0;
  }

  const weightedTotal = children.reduce(
    (total, child) => total + progressFor(child) * weightFor(child),
    0,
  );
  const totalWeight = children.reduce((total, child) => total + weightFor(child), 0);
  return Math.round(weightedTotal / totalWeight);
}

type TaskReference = {
  id: string;
  status: TaskStatus;
  progress?: number;
  weight?: number;
  children?: string[];
  parentId?: string | null;
  phaseId?: string;
};

export function deriveTaskProgress(
  parent: TaskReference,
  tasks: TaskReference[],
): number {
  const childIds = new Set(parent.children ?? []);
  const children = tasks.filter((task) =>
    childIds.size > 0 ? childIds.has(task.id) : task.parentId === parent.id,
  );
  return children.length === 0
    ? progressFor(parent)
    : calculateParentProgress(children);
}

function isLeaf(task: TaskReference): boolean {
  return !task.children || task.children.length === 0;
}

const EMPTY_STATUS_COUNTS = (): Record<TaskStatus, number> => ({
  NOT_STARTED: 0,
  IN_PROGRESS: 0,
  BLOCKED: 0,
  WAITING_USER: 0,
  WAITING_REVIEW: 0,
  COMPLETED: 0,
  PAUSED: 0,
});

export type TaskSummary = {
  total: number;
  progress: number;
  byStatus: Record<TaskStatus, number>;
};

export function summarizeTasks(tasks: TaskReference[]): TaskSummary {
  const leaves = tasks.filter(isLeaf);
  const byStatus = EMPTY_STATUS_COUNTS();

  for (const task of leaves) {
    byStatus[task.status] += 1;
  }

  return {
    total: leaves.length,
    progress: calculateParentProgress(leaves),
    byStatus,
  };
}

export function calculatePhaseProgress(phaseId: string, tasks: TaskReference[]): number {
  return calculateParentProgress(tasks.filter((task) => task.phaseId === phaseId && isLeaf(task)));
}

export type PhaseSummary = {
  id: string;
  name: string;
  order: number;
  progress: number;
  taskCount: number;
};

export function buildPhaseSummaries(
  phases: Phase[],
  tasks: TaskReference[],
): PhaseSummary[] {
  return [...phases]
    .sort((left, right) => left.order - right.order)
    .map((phase) => ({
      id: phase.id,
      name: phase.name,
      order: phase.order,
      progress: calculatePhaseProgress(phase.id, tasks),
      taskCount: tasks.filter((task) => task.phaseId === phase.id && isLeaf(task)).length,
    }));
}

function normalizeRootPath(rootPath: string): string {
  const normalized = rootPath.trim().replaceAll("\\", "/").replace(/\/+/g, "/");
  if (normalized.length <= 1) {
    return normalized;
  }
  return normalized.replace(/\/+$/, "");
}

export type ProjectRootContractInput = {
  project: Pick<ProjectFile, "projectId" | "rootPath">;
  tasks: Pick<TaskFile, "projectId">;
  runtime: Pick<Runtime, "projectId">;
  sessions?: Array<Pick<Session, "id">>;
  expectedRootPath?: string;
};

export function assertProjectRootContract({
  project,
  tasks,
  runtime,
  sessions = [],
  expectedRootPath,
}: ProjectRootContractInput): { projectId: string; rootPath: string } {
  if (tasks.projectId !== project.projectId) {
    throw new Error("tasks projectId does not match project.json projectId");
  }
  if (runtime.projectId !== project.projectId) {
    throw new Error("runtime projectId does not match project.json projectId");
  }
  if (sessions.some((session) => session.id === project.projectId)) {
    throw new Error("session id cannot be reused as project identity");
  }

  const rootPath = normalizeRootPath(project.rootPath);
  if (expectedRootPath !== undefined && rootPath.toLowerCase() !== normalizeRootPath(expectedRootPath).toLowerCase()) {
    throw new Error("project rootPath does not match expected project root");
  }

  return { projectId: project.projectId, rootPath };
}

export function parseEventsJsonl(content: string): LedgerEvent[] {
  const events: LedgerEvent[] = [];

  content.split(/\r?\n/).forEach((line, index) => {
    if (line.trim() === "") {
      return;
    }

    const lineNumber = index + 1;
    let value: unknown;
    try {
      value = JSON.parse(line);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "invalid JSON";
      throw new Error(`Invalid event at line ${lineNumber}: ${detail}`);
    }

    const parsed = EventSchema.safeParse(value);
    if (!parsed.success) {
      throw new Error(`Invalid event at line ${lineNumber}: ${parsed.error.message}`);
    }
    events.push(parsed.data);
  });

  return events;
}
