export { detectLegacyFiles, isLegacyFileName } from "./detect.js";
export {
  migrateLegacyProject,
  initializeEmptyLedger,
  deriveProjectId,
  listMachineFiles,
} from "./bootstrap.js";
export { parseLegacyMarkdown, parseLegacyStatus } from "./parse.js";
export type {
  BootstrapOptions,
  BootstrapResult,
} from "./bootstrap.js";
export type {
  LegacyDetection,
  LegacyStatus,
  MigrationConfidence,
  MigrationWarning,
  MigratedTask,
  ParsedLegacyMarkdown,
} from "./types.js";
