import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  migrateLegacyProject,
  initializeEmptyLedger,
} from "../../server/migration/index.js";
import {
  ArtifactFileSchema,
  ProjectFileSchema,
  RoleFileSchema,
  RuntimeSchema,
  SessionFileSchema,
  TaskFileSchema,
  parseEventsJsonl,
} from "../../packages/ledger-schema/src/index.js";

const fixtureRoot = join(import.meta.dirname, "../../fixtures/project-legacy-md");
const machineFiles = [
  "project.json",
  "tasks.json",
  "roles.json",
  "sessions.json",
  "artifacts.json",
  "events.jsonl",
  "runtime.json",
];

function copyFixture(): string {
  const projectRoot = mkdtempSync(join(tmpdir(), "legacy-migration-"));
  cpSync(fixtureRoot, projectRoot, { recursive: true });
  return projectRoot;
}

describe("legacy migration and project bootstrap", () => {
  it("migrates legacy tasks into a valid machine ledger without rewriting Markdown", () => {
    const projectRoot = copyFixture();
    const originalMarkdown = new Map(
      readdirSync(projectRoot)
        .filter((name) => name.endsWith(".md"))
        .map((name) => [name, readFileSync(join(projectRoot, name), "utf8")]),
    );

    const result = migrateLegacyProject({
      projectRoot,
      now: "2026-09-08T18:00:00.000Z",
      projectId: "legacy-fixture",
    });

    expect(result.kind).toBe("migrated");
    expect(result.tasks.some((task) => task.status === "COMPLETED")).toBe(true);
    expect(result.tasks.some((task) => task.status === "NOT_STARTED" && task.migrationConfidence === "LOW")).toBe(true);
    expect(result.warnings.some((warning) => warning.confidence === "LOW")).toBe(true);

    expect(ProjectFileSchema.parse(JSON.parse(readFileSync(join(projectRoot, ".ai-ledger/project.json"), "utf8")))).toBeDefined();
    expect(TaskFileSchema.parse(JSON.parse(readFileSync(join(projectRoot, ".ai-ledger/tasks.json"), "utf8")))).toBeDefined();
    expect(RoleFileSchema.parse(JSON.parse(readFileSync(join(projectRoot, ".ai-ledger/roles.json"), "utf8")))).toBeDefined();
    expect(SessionFileSchema.parse(JSON.parse(readFileSync(join(projectRoot, ".ai-ledger/sessions.json"), "utf8")))).toBeDefined();
    expect(ArtifactFileSchema.parse(JSON.parse(readFileSync(join(projectRoot, ".ai-ledger/artifacts.json"), "utf8")))).toBeDefined();
    expect(RuntimeSchema.parse(JSON.parse(readFileSync(join(projectRoot, ".ai-ledger/runtime.json"), "utf8")))).toBeDefined();
    expect(parseEventsJsonl(readFileSync(join(projectRoot, ".ai-ledger/events.jsonl"), "utf8"))).toBeDefined();

    for (const [name, content] of originalMarkdown) {
      expect(readFileSync(join(projectRoot, name), "utf8")).toBe(content);
    }
  });

  it("initializes an empty seven-file skeleton for a project without legacy Markdown", () => {
    const projectRoot = mkdtempSync(join(tmpdir(), "empty-bootstrap-"));

    const result = initializeEmptyLedger({
      projectRoot,
      now: "2026-09-08T18:00:00.000Z",
      projectId: "empty-fixture",
    });

    expect(result.kind).toBe("initialized");
    for (const file of machineFiles) {
      expect(existsSync(join(projectRoot, ".ai-ledger", file))).toBe(true);
    }
    expect(JSON.parse(readFileSync(join(projectRoot, ".ai-ledger/tasks.json"), "utf8"))).toMatchObject({
      projectId: "empty-fixture",
      tasks: [],
    });
  });

  it("lets an existing .ai-ledger win and leaves it untouched", () => {
    const projectRoot = mkdtempSync(join(tmpdir(), "existing-ledger-"));
    const ledgerRoot = join(projectRoot, ".ai-ledger");
    const marker = "{\"existing\":true}\n";
    cpSync(fixtureRoot, projectRoot, { recursive: true });
    mkdirSync(ledgerRoot);
    writeFileSync(join(ledgerRoot, "project.json"), marker);

    const result = migrateLegacyProject({ projectRoot, projectId: "should-not-be-used" });

    expect(result.kind).toBe("existing");
    expect(result.legacyFiles).toContain("00_PROJECT_ENTRY.md");
    expect(readFileSync(join(ledgerRoot, "project.json"), "utf8")).toBe(marker);
  });
});
