import type { TaskStatus } from "../../packages/ledger-schema/src/index.js";
import type {
  LegacyStatus,
  MigrationWarning,
  MigratedTask,
  ParsedLegacyMarkdown,
} from "./types.js";

const CHECKBOX_LINE = /^\s*(?:[-*+] |\d+[.)]\s+)?\[([ xX])\]\s+(.+?)\s*$/;
const BULLET_LINE = /^\s*(?:[-*+] |\d+[.)]\s+)(.+?)\s*$/;

const EXPLICIT_STATUSES: Array<{
  phrase: string;
  status: TaskStatus;
  progress: number;
}> = [
  { phrase: "等待用户", status: "WAITING_USER", progress: 0 },
  { phrase: "正在开发", status: "IN_PROGRESS", progress: 50 },
  { phrase: "进行中", status: "IN_PROGRESS", progress: 50 },
  { phrase: "阻塞", status: "BLOCKED", progress: 0 },
];

function statusFromTitle(title: string): LegacyStatus {
  const explicitPhrase = title.match(/^\s*(等待用户|正在开发|进行中|阻塞)(?=$|[\s:：])/u)?.[1];
  const candidate = EXPLICIT_STATUSES.find(({ phrase }) => phrase === explicitPhrase);

  if (candidate) {
    return {
      status: candidate.status,
      confidence: "MEDIUM",
      progress: candidate.progress,
      blockedReason: candidate.status === "BLOCKED" ? title.trim() : null,
      waitingUserReason: candidate.status === "WAITING_USER" ? title.trim() : null,
    };
  }

  return {
    status: "NOT_STARTED",
    confidence: "LOW",
    progress: 0,
    blockedReason: null,
    waitingUserReason: null,
  };
}

export function parseLegacyStatus(title: string): LegacyStatus {
  const checkbox = title.match(/^\s*\[([ xX])\]\s*(.*)$/);
  if (checkbox) {
    const checked = checkbox[1]?.toLowerCase() === "x";
    return {
      status: checked ? "COMPLETED" : "NOT_STARTED",
      confidence: "HIGH",
      progress: checked ? 100 : 0,
      blockedReason: null,
      waitingUserReason: null,
    };
  }

  return statusFromTitle(title);
}

function createTask(
  title: string,
  sourceFile: string,
  sourceLine: number,
  now: string,
  legacyStatus: LegacyStatus,
): MigratedTask {
  const idPart = sourceFile
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  const id = `legacy-${idPart || "document"}-${sourceLine}`;
  const completedAt = legacyStatus.status === "COMPLETED" ? now : null;

  return {
    id,
    phaseId: "P01",
    parentId: null,
    title: title.trim(),
    description: `Migrated from ${sourceFile}:${sourceLine}`,
    status: legacyStatus.status,
    progress: legacyStatus.progress,
    priority: "P1",
    roleId: null,
    agent: "legacy-migration",
    sessionId: null,
    dependsOn: [],
    blockedReason: legacyStatus.blockedReason,
    waitingUserReason: legacyStatus.waitingUserReason,
    startedAt: null,
    updatedAt: now,
    completedAt,
    artifacts: [],
    children: [],
    migrationConfidence: legacyStatus.confidence,
    sourceFile,
    sourceLine,
  };
}

export function parseLegacyMarkdown(
  content: string,
  sourceFile: string,
  now = new Date().toISOString(),
): ParsedLegacyMarkdown {
  const tasks: MigratedTask[] = [];
  const warnings: MigrationWarning[] = [];

  content.split(/\r?\n/).forEach((line, index) => {
    const lineNumber = index + 1;
    const checkboxMatch = line.match(CHECKBOX_LINE);
    const bulletMatch = checkboxMatch ? null : line.match(BULLET_LINE);
    const title = checkboxMatch?.[2] ?? bulletMatch?.[1];
    if (!title) {
      return;
    }

    const parsedStatus = checkboxMatch
      ? parseLegacyStatus(checkboxMatch[1] === "x" || checkboxMatch[1] === "X" ? "[x]" : "[ ]")
      : parseLegacyStatus(title);
    const task = createTask(title, sourceFile, lineNumber, now, parsedStatus);
    tasks.push(task);

    if (parsedStatus.confidence === "LOW") {
      warnings.push({
        file: sourceFile,
        line: lineNumber,
        taskTitle: task.title,
        confidence: "LOW",
        message: `Unknown legacy status for '${task.title}'; defaulted to NOT_STARTED`,
      });
    }
  });

  return { tasks, warnings };
}
