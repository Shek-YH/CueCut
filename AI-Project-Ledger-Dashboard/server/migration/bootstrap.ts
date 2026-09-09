import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { basename, join, resolve } from "node:path";
import {
  parseLegacyMarkdown,
} from "./parse.js";
import { detectLegacyFiles } from "./detect.js";
import type {
  LegacyDetection,
  MigrationWarning,
  MigratedTask,
} from "./types.js";

const MACHINE_FILES = [
  "project.json",
  "tasks.json",
  "roles.json",
  "sessions.json",
  "artifacts.json",
  "events.jsonl",
  "runtime.json",
] as const;

export type BootstrapOptions = {
  projectRoot: string;
  projectId?: string;
  now?: string;
};

export type BootstrapResult = {
  kind: "initialized" | "migrated" | "existing";
  projectRoot: string;
  ledgerRoot: string;
  projectId: string | null;
  tasks: MigratedTask[];
  warnings: MigrationWarning[];
  legacyFiles: string[];
};

export function deriveProjectId(projectRoot: string): string {
  const canonicalRoot = resolve(projectRoot);
  const name = basename(canonicalRoot)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "project";
  const digest = createHash("sha1").update(canonicalRoot.toLowerCase()).digest("hex").slice(0, 8);
  return `${name}-${digest}`;
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function persistableTask(task: MigratedTask): Omit<MigratedTask, "migrationConfidence" | "sourceFile" | "sourceLine"> {
  const {
    migrationConfidence: _migrationConfidence,
    sourceFile: _sourceFile,
    sourceLine: _sourceLine,
    ...persisted
  } = task;
  return persisted;
}

function createProjectFile(projectRoot: string, projectId: string, now: string) {
  return {
    schemaVersion: 1,
    projectId,
    name: basename(projectRoot) || projectRoot,
    rootPath: projectRoot,
    createdAt: now,
    updatedAt: now,
    phases: [{ id: "P01", name: "Legacy Migration", order: 1 }],
  };
}

function writeSkeleton(
  projectRoot: string,
  ledgerRoot: string,
  projectId: string,
  now: string,
  tasks: MigratedTask[],
): void {
  mkdirSync(ledgerRoot, { recursive: false });
  writeJson(join(ledgerRoot, "project.json"), createProjectFile(projectRoot, projectId, now));
  writeJson(join(ledgerRoot, "tasks.json"), {
    schemaVersion: 1,
    projectId,
    updatedAt: now,
    tasks: tasks.map(persistableTask),
  });
  writeJson(join(ledgerRoot, "roles.json"), { schemaVersion: 1, roles: [] });
  writeJson(join(ledgerRoot, "sessions.json"), { schemaVersion: 1, sessions: [] });
  writeJson(join(ledgerRoot, "artifacts.json"), { schemaVersion: 1, artifacts: [] });
  writeFileSync(join(ledgerRoot, "events.jsonl"), "", "utf8");
  writeJson(join(ledgerRoot, "runtime.json"), {
    schemaVersion: 1,
    projectId,
    ledgerWriter: "AI_Project_Ledger_Dashboard_V1",
    active: false,
    currentTaskIds: [],
    lastWriteAt: now,
  });
}

function existingResult(detection: LegacyDetection): BootstrapResult {
  return {
    kind: "existing",
    projectRoot: detection.projectRoot,
    ledgerRoot: detection.aiLedgerPath,
    projectId: null,
    tasks: [],
    warnings: [],
    legacyFiles: detection.legacyFiles,
  };
}

export function initializeEmptyLedger(options: BootstrapOptions): BootstrapResult {
  const detection = detectLegacyFiles(options.projectRoot);
  if (detection.hasAiLedger) {
    return existingResult(detection);
  }

  const now = options.now ?? new Date().toISOString();
  const projectId = options.projectId ?? deriveProjectId(detection.projectRoot);
  writeSkeleton(detection.projectRoot, detection.aiLedgerPath, projectId, now, []);

  return {
    kind: "initialized",
    projectRoot: detection.projectRoot,
    ledgerRoot: detection.aiLedgerPath,
    projectId,
    tasks: [],
    warnings: [],
    legacyFiles: [],
  };
}

export function migrateLegacyProject(options: BootstrapOptions): BootstrapResult {
  const detection = detectLegacyFiles(options.projectRoot);
  if (detection.hasAiLedger) {
    return existingResult(detection);
  }

  if (!detection.hasLegacyFiles) {
    return initializeEmptyLedger(options);
  }

  const now = options.now ?? new Date().toISOString();
  const projectId = options.projectId ?? deriveProjectId(detection.projectRoot);
  const tasks: MigratedTask[] = [];
  const warnings: MigrationWarning[] = [];

  for (const file of detection.legacyFiles) {
    const parsed = parseLegacyMarkdown(
      readFileSync(join(detection.projectRoot, file), "utf8"),
      file,
      now,
    );
    tasks.push(...parsed.tasks);
    warnings.push(...parsed.warnings);
  }

  writeSkeleton(detection.projectRoot, detection.aiLedgerPath, projectId, now, tasks);

  return {
    kind: "migrated",
    projectRoot: detection.projectRoot,
    ledgerRoot: detection.aiLedgerPath,
    projectId,
    tasks,
    warnings,
    legacyFiles: detection.legacyFiles,
  };
}

export function listMachineFiles(): readonly string[] {
  return MACHINE_FILES;
}
