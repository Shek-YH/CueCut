import { promises as fs, createWriteStream } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

export interface RealtimeCaptureStoreRequest {
  jobId: string;
  fileName: string;
  body: AsyncIterable<Uint8Array>;
}

export interface RealtimeCaptureStoredArtifact {
  jobId: string;
  directory: string;
  fileName: string;
  outputPath: string;
  size: number;
}

export function createRealtimeCaptureStore(options: { rootDirectory?: string } = {}) {
  const rootDirectory = options.rootDirectory ?? join(tmpdir(), 'cuecut-realtime');
  return {
    async persist(request: RealtimeCaptureStoreRequest): Promise<RealtimeCaptureStoredArtifact> {
      const jobId = safePart(request.jobId, 'job');
      const fileName = safeFileName(request.fileName);
      await fs.mkdir(rootDirectory, { recursive: true });
      const directory = await fs.mkdtemp(join(rootDirectory, `capture-${jobId}-`));
      const temporaryPath = join(directory, `${fileName}.tmp`);
      const outputPath = join(directory, fileName);
      try {
        await pipeline(Readable.from(request.body), createWriteStream(temporaryPath));
        const temporaryStats = await fs.stat(temporaryPath);
        if (temporaryStats.size <= 0) throw new Error('Realtime capture output is empty');
        await fs.rename(temporaryPath, outputPath);
        return { jobId, directory, fileName, outputPath, size: temporaryStats.size };
      } catch (error) {
        await fs.rm(directory, { recursive: true, force: true });
        throw error;
      }
    },
  };
}

export async function cleanupStaleRealtimeCaptureTemps(rootDirectory: string, maxAgeMs: number): Promise<void> {
  const entries = await fs.readdir(rootDirectory, { withFileTypes: true }).catch(() => []);
  const cutoff = Date.now() - Math.max(0, maxAgeMs);
  await Promise.all(entries.filter((entry) => entry.isDirectory() && entry.name.startsWith('cuecut-realtime-')).map(async (entry) => {
    const directory = join(rootDirectory, entry.name);
    const metadata = await fs.stat(directory).catch(() => null);
    if (metadata && metadata.mtimeMs <= cutoff) await fs.rm(directory, { recursive: true, force: true });
  }));
}

function safePart(value: string, fallback: string): string {
  const safe = value.replace(/[^a-zA-Z0-9_-]/g, '_');
  return safe || fallback;
}

function safeFileName(value: string): string {
  const name = basename(value).replace(/[^a-zA-Z0-9._-]/g, '_');
  return name || 'capture.webm';
}
