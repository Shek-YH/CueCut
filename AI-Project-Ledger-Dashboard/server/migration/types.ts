import type { Task, TaskStatus } from "../../packages/ledger-schema/src/index.js";

export type MigrationConfidence = "HIGH" | "MEDIUM" | "LOW";

export type MigrationWarning = {
  file: string;
  line: number;
  taskTitle: string;
  confidence: "LOW";
  message: string;
};

export type MigratedTask = Task & {
  migrationConfidence: MigrationConfidence;
  sourceFile: string;
  sourceLine: number;
};

export type LegacyDetection = {
  projectRoot: string;
  aiLedgerPath: string;
  hasAiLedger: boolean;
  legacyFiles: string[];
  hasLegacyFiles: boolean;
};

export type ParsedLegacyMarkdown = {
  tasks: MigratedTask[];
  warnings: MigrationWarning[];
};

export type LegacyStatus = {
  status: TaskStatus;
  confidence: MigrationConfidence;
  progress: number;
  blockedReason: string | null;
  waitingUserReason: string | null;
};
