import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

async function loadSecurityModule(): Promise<Record<string, unknown> | undefined> {
  const modulePath = fileURLToPath(
    new URL("../../server/security/paths.ts", import.meta.url),
  );
  return existsSync(modulePath)
    ? ((await import(pathToFileURL(modulePath).href)) as Record<string, unknown>)
    : undefined;
}

describe("ledger security boundaries", () => {
  it("allows exactly the seven machine ledger files", async () => {
    const security = await loadSecurityModule();
    expect(security).toBeDefined();
    if (!security) return;

    expect(security.ALLOWED_LEDGER_FILES).toEqual([
      "project.json",
      "tasks.json",
      "roles.json",
      "sessions.json",
      "artifacts.json",
      "events.jsonl",
      "runtime.json",
    ]);
    const isAllowedLedgerFile = security.isAllowedLedgerFile as (
      fileName: string,
    ) => boolean;
    expect(isAllowedLedgerFile("project.json")).toBe(true);
    expect(isAllowedLedgerFile("../project.json")).toBe(false);
    expect(isAllowedLedgerFile("password.json")).toBe(false);
    expect(isAllowedLedgerFile("notes.json")).toBe(false);
  });

  it("denies sensitive path names", async () => {
    const security = await loadSecurityModule();
    expect(security).toBeDefined();
    if (!security) return;

    const isSensitivePath = security.isSensitivePath as (
      filePath: string,
    ) => boolean;
    for (const name of [
      ".env",
      "credentials.json",
      "api-token.txt",
      "browser-cookie.txt",
      "database-password.txt",
      ".ssh/id_rsa",
      "client-secret.json",
    ]) {
      expect(isSensitivePath(name)).toBe(true);
    }
    expect(isSensitivePath("src/index.ts")).toBe(false);
  });

  it("keeps artifact paths contained under the project root", async () => {
    const security = await loadSecurityModule();
    expect(security).toBeDefined();
    if (!security) return;

    const resolveContainedArtifactPath = security.resolveContainedArtifactPath as (
      projectRoot: string,
      artifactPath: string,
    ) => string;
    const root = path.resolve("F:/projects/demo");
    expect(resolveContainedArtifactPath(root, "src/index.ts")).toBe(
      path.resolve(root, "src/index.ts"),
    );
    expect(() => resolveContainedArtifactPath(root, "../outside.txt")).toThrow(
      /contain|root|outside|traversal/i,
    );
    expect(() =>
      resolveContainedArtifactPath(root, path.resolve(root + "-sibling", "x.txt")),
    ).toThrow(/absolute|relative|contain|root|outside/i);
    expect(() => resolveContainedArtifactPath(root, "secrets/api-token.txt")).toThrow(
      /sensitive|secret|contain/i,
    );
  });

  it("requires artifact paths to be relative and rejects traversal segments", async () => {
    const security = await loadSecurityModule();
    expect(security).toBeDefined();
    if (!security) return;

    const resolveContainedArtifactPath = security.resolveContainedArtifactPath as (
      projectRoot: string,
      artifactPath: string,
    ) => string;
    const root = path.resolve("F:/projects/demo");

    expect(() => resolveContainedArtifactPath(root, "src/../safe.txt")).toThrow(
      /traversal|relative/i,
    );
    expect(() => resolveContainedArtifactPath(root, path.resolve(root, "src/index.ts"))).toThrow(
      /absolute|relative/i,
    );
  });
});
