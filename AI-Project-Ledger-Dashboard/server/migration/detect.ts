import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import type { LegacyDetection } from "./types.js";

const EXACT_LEGACY_NAMES = new Set([
  "00_PROJECT_ENTRY.md",
  "01_ROLES_AND_RESPONSIBILITIES.md",
].map((name) => name.toUpperCase()));

const LEGACY_MARKERS = [
  "TASK",
  "TODO",
  "IMPLEMENTATION_LOG",
  "TEST_PLAN",
  "FINAL_ACCEPTANCE",
];

export function isLegacyFileName(name: string): boolean {
  if (!name.toLowerCase().endsWith(".md")) {
    return false;
  }

  if (EXACT_LEGACY_NAMES.has(name.toUpperCase())) {
    return true;
  }

  const upperName = name.toUpperCase();
  return LEGACY_MARKERS.some((marker) => upperName.includes(marker));
}

export function detectLegacyFiles(projectRoot: string): LegacyDetection {
  const canonicalRoot = resolve(projectRoot);
  if (!existsSync(canonicalRoot) || !statSync(canonicalRoot).isDirectory()) {
    throw new Error(`Project root does not exist or is not a directory: ${projectRoot}`);
  }

  const aiLedgerPath = join(canonicalRoot, ".ai-ledger");
  const hasAiLedger = existsSync(aiLedgerPath);
  const legacyFiles = readdirSync(canonicalRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && isLegacyFileName(entry.name))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  return {
    projectRoot: canonicalRoot,
    aiLedgerPath,
    hasAiLedger,
    legacyFiles,
    hasLegacyFiles: legacyFiles.length > 0,
  };
}
