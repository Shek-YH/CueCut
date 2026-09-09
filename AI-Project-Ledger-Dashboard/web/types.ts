export const TASK_STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "BLOCKED",
  "WAITING_USER",
  "WAITING_REVIEW",
  "COMPLETED",
  "PAUSED",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export type Phase = {
  id: string;
  name: string;
  order: number;
  locked?: boolean;
};

export type Project = {
  schemaVersion: 1;
  projectId: string;
  name: string;
  rootPath: string;
  createdAt: string;
  updatedAt: string;
  phases: Phase[];
};

export type Task = {
  id: string;
  phaseId: string;
  parentId: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  progress: number;
  priority: string;
  roleId: string | null;
  agent: string;
  sessionId: string | null;
  dependsOn: string[];
  blockedReason: string | null;
  waitingUserReason: string | null;
  startedAt: string | null;
  updatedAt: string;
  completedAt: string | null;
  artifacts: string[];
  children: string[];
  weight?: number;
};

export type TaskTreeNode = Omit<Task, "children"> & {
  children: TaskTreeNode[];
};

export type TaskSummary = {
  total: number;
  progress: number;
  byStatus: Record<TaskStatus, number>;
};

export type PhaseSummary = Phase & {
  progress: number;
  taskCount: number;
};

export type Role = {
  id: string;
  name: string;
  agent: string;
  description?: string;
};

export type Session = {
  id: string;
  provider: string;
  roleId?: string | null;
  status: string;
  startedAt: string;
  lastSeenAt: string;
  taskIds: string[];
};

export type Artifact = {
  id: string;
  taskId: string;
  type: string;
  path: string;
  exists: boolean;
  updatedAt: string;
};

export type Runtime = {
  schemaVersion: 1;
  projectId: string;
  ledgerWriter: string;
  active: boolean;
  currentTaskIds: string[];
  lastWriteAt: string;
};

export type LedgerEvent = {
  eventId: string;
  ts: string;
  type: string;
  actor: string;
  sessionId?: string | null;
  taskId?: string;
  from?: TaskStatus | number;
  to?: TaskStatus | number;
  artifactId?: string;
  roleId?: string;
  reason?: string;
  path?: string;
};

export type DashboardSnapshot = {
  project: Project;
  projectId: string;
  rootPath: string;
  summary: TaskSummary;
  phases: PhaseSummary[];
  tasks: Task[];
  taskTree: TaskTreeNode[];
  roles: Role[];
  sessions: Session[];
  artifacts: Artifact[];
  runtime: Runtime;
  events: LedgerEvent[];
  recentEvents: LedgerEvent[];
};

export type SnapshotEnvelope = {
  snapshot: DashboardSnapshot;
  warning: { code: string; message: string } | null;
  usedLastKnownGood: boolean;
};

export type ProjectRegistration = {
  projectId: string;
  name: string;
  rootPath: string;
};
