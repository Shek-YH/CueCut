import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseLegacyMarkdown } from "../../server/migration/index.js";

const fixtureRoot = join(import.meta.dirname, "../../fixtures/project-legacy-md");

describe("legacy Markdown status parser", () => {
  it("maps checked and unchecked Markdown boxes to machine statuses", () => {
    const result = parseLegacyMarkdown(
      readFileSync(join(fixtureRoot, "00_PROJECT_ENTRY.md"), "utf8"),
      "00_PROJECT_ENTRY.md",
      "2026-09-08T18:00:00.000Z",
    );

    expect(result.tasks[0]).toMatchObject({
      title: "已完成旧任务",
      status: "COMPLETED",
      progress: 100,
      migrationConfidence: "HIGH",
    });
    expect(result.tasks[1]).toMatchObject({
      title: "尚未开始旧任务",
      status: "NOT_STARTED",
      progress: 0,
      migrationConfidence: "HIGH",
    });
  });

  it("maps only explicit Chinese in-progress, blocked and waiting-user phrases", () => {
    const result = parseLegacyMarkdown(
      [
        "- 进行中：实现迁移",
        "- 阻塞：等待依赖",
        "- 等待用户：补充素材",
      ].join("\n"),
      "legacy.md",
      "2026-09-08T18:00:00.000Z",
    );

    expect(result.tasks.map((task) => task.status)).toEqual([
      "IN_PROGRESS",
      "BLOCKED",
      "WAITING_USER",
    ]);
    expect(result.tasks[1]?.blockedReason).toContain("阻塞");
    expect(result.tasks[2]?.waitingUserReason).toContain("等待用户");
    expect(result.warnings).toEqual([]);
  });

  it("maps the PRD's 正在开发 phrase to IN_PROGRESS", () => {
    const result = parseLegacyMarkdown(
      "- 正在开发：实现迁移\n",
      "legacy.md",
      "2026-09-08T18:00:00.000Z",
    );

    expect(result.tasks[0]).toMatchObject({
      status: "IN_PROGRESS",
      progress: 50,
      migrationConfidence: "MEDIUM",
    });
    expect(result.warnings).toEqual([]);
  });

  it("does not match an embedded or negated in-progress phrase", () => {
    const result = parseLegacyMarkdown(
      "- 未进行中的旧条目\n",
      "legacy.md",
      "2026-09-08T18:00:00.000Z",
    );

    expect(result.tasks[0]).toMatchObject({
      title: "未进行中的旧条目",
      status: "NOT_STARTED",
      progress: 0,
      migrationConfidence: "LOW",
    });
    expect(result.warnings).toEqual([
      expect.objectContaining({
        line: 1,
        taskTitle: "未进行中的旧条目",
        confidence: "LOW",
      }),
    ]);
  });

  it("keeps an unknown task NOT_STARTED with LOW confidence and a warning", () => {
    const result = parseLegacyMarkdown(
      "- 状态不明确的旧条目\n",
      "legacy.md",
      "2026-09-08T18:00:00.000Z",
    );

    expect(result.tasks[0]).toMatchObject({
      status: "NOT_STARTED",
      progress: 0,
      migrationConfidence: "LOW",
    });
    expect(result.warnings).toEqual([
      expect.objectContaining({
        line: 1,
        confidence: "LOW",
        message: expect.stringMatching(/unknown|ambiguous|明确/i),
      }),
    ]);
  });
});
