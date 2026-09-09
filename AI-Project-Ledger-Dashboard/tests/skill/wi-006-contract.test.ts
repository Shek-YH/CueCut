import { readFileSync } from "node:fs";

const skillPath = "C:/Users/Administrator/.codex/skills/ai-autonomous-project-ledger-skill/SKILL.md";
const skill = readFileSync(skillPath, "utf8");

describe("WI-006 machine-ledger Skill contract", () => {
  it("states the complete dual-write contract", () => {
    const requiredContractPhrases = [
      "The runtime contract requires exactly these seven files",
      "`projectId` is stable for the Project Root",
      "`BLOCKED` requires a non-empty `blockedReason`",
      "`WAITING_USER` requires a non-empty `waitingUserReason`",
      "`COMPLETED` requires progress `= 100` and `completedAt != null`",
      "tasks.json.tmp",
      "`events.jsonl` is append-only",
      "Replace Last Known Good only after validation passes",
      "Password, API Key, Token, Cookie, Secret",
      "Dashboard V1 is read-only for project task state",
    ];

    for (const phrase of requiredContractPhrases) {
      expect(skill).toContain(phrase);
    }
  });

  it("keeps the existing lifecycle gates in place", () => {
    expect(skill).toContain("# 4. Git Gate");
    expect(skill).toContain("# 8. Dashboard Gate");
    expect(skill).toContain("# 20. Autonomous loop");
    expect(skill).toContain("# 22. Final acceptance");
  });
});
