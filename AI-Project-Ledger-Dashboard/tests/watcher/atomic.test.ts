import { existsSync } from "node:fs";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

async function loadAtomicModule(): Promise<Record<string, unknown> | undefined> {
  const modulePath = fileURLToPath(new URL("../../server/atomic.ts", import.meta.url));
  return existsSync(modulePath)
    ? ((await import(pathToFileURL(modulePath).href)) as Record<string, unknown>)
    : undefined;
}

describe("atomic ledger writes", () => {
  it("writes a complete value through a temporary file and rename", async () => {
    const atomic = await loadAtomicModule();
    expect(atomic).toBeDefined();
    if (!atomic) return;

    const root = await mkdtemp(path.join(tmpdir(), "wi-003-atomic-"));
    try {
      const target = path.join(root, "tasks.json");
      await writeFile(target, "old");
      const atomicWriteFile = atomic.atomicWriteFile as (
        filePath: string,
        data: string,
      ) => Promise<void>;

      await atomicWriteFile(target, "new complete value");

      expect(await readFile(target, "utf8")).toBe("new complete value");
      expect((await readdir(root)).filter((name) => name.includes(".tmp"))).toEqual([]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
