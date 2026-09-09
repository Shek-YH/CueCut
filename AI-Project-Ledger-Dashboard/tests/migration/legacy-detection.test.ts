import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { detectLegacyFiles } from "../../server/migration/index.js";

const fixtureRoot = join(import.meta.dirname, "../../fixtures/project-legacy-md");

describe("legacy project detection", () => {
  it("detects the allowlisted legacy Markdown names and ignores unrelated files", () => {
    const result = detectLegacyFiles(fixtureRoot);

    expect(result.hasAiLedger).toBe(false);
    expect(result.hasLegacyFiles).toBe(true);
    expect(result.legacyFiles).toEqual([
      "00_PROJECT_ENTRY.md",
      "01_ROLES_AND_RESPONSIBILITIES.md",
      "02_TASKS.md",
      "05_TEST_PLAN.md",
      "07_IMPLEMENTATION_LOG.md",
      "11_FINAL_ACCEPTANCE.md",
    ]);
    expect(result.legacyFiles).not.toContain("README.md");
  });

  it("reports an existing .ai-ledger without treating it as legacy input", () => {
    const projectRoot = mkdtempSync(join(tmpdir(), "ledger-detection-"));
    mkdirSync(join(projectRoot, ".ai-ledger"));
    writeFileSync(join(projectRoot, "README.md"), "# project\n");

    const result = detectLegacyFiles(projectRoot);

    expect(result.hasAiLedger).toBe(true);
    expect(result.legacyFiles).toEqual([]);
    expect(result.hasLegacyFiles).toBe(false);
  });

  it("reports existing machine and legacy inputs independently", () => {
    const projectRoot = mkdtempSync(join(tmpdir(), "ledger-detection-both-"));
    mkdirSync(join(projectRoot, ".ai-ledger"));
    writeFileSync(join(projectRoot, "TODO.md"), "- [ ] legacy\n");

    const result = detectLegacyFiles(projectRoot);

    expect(result.hasAiLedger).toBe(true);
    expect(result.legacyFiles).toEqual(["TODO.md"]);
    expect(result.hasLegacyFiles).toBe(true);
  });
});
