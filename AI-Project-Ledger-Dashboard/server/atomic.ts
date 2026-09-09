import { open, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export async function atomicWriteFile(
  filePath: string,
  data: string | Uint8Array,
): Promise<void> {
  const resolvedPath = path.resolve(filePath);
  const temporaryPath = path.join(
    path.dirname(resolvedPath),
    `.${path.basename(resolvedPath)}.${randomUUID()}.tmp`,
  );

  try {
    await writeFile(temporaryPath, data);
    const handle = await open(temporaryPath, "r+");
    try {
      await handle.sync();
    } finally {
      await handle.close();
    }
    await rename(temporaryPath, resolvedPath);
  } catch (error) {
    await unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
}

export const writeFileAtomically = atomicWriteFile;
