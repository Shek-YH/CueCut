import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, readdir, readFile, rm, stat, utimes } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRealtimeCaptureStore, cleanupStaleRealtimeCaptureTemps } from '../../src/server/realtimeCaptureStore';

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe('realtime capture temp store', () => {
  it('writes to a temporary file and promotes only after a non-empty write', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cuecut-realtime-test-'));
    directories.push(root);
    const store = createRealtimeCaptureStore({ rootDirectory: root });
    const result = await store.persist({ jobId: 'job-123', fileName: 'My Capture.webm', body: [new Uint8Array([1, 2]), new Uint8Array([3])] });
    expect(result.fileName).toBe('My_Capture.webm');
    expect(await readFile(result.outputPath)).toEqual(Buffer.from([1, 2, 3]));
    expect((await readdir(result.directory)).some((name) => name.endsWith('.tmp'))).toBe(false);
    expect((await stat(result.outputPath)).size).toBe(3);
  });

  it('rejects empty output and removes stale unfinished capture directories', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cuecut-realtime-test-'));
    directories.push(root);
    const store = createRealtimeCaptureStore({ rootDirectory: root });
    await expect(store.persist({ jobId: 'empty', fileName: 'empty.webm', body: [] })).rejects.toThrow(/empty/i);
    const stale = await mkdtemp(join(root, 'cuecut-realtime-stale-'));
    await utimes(stale, new Date(0), new Date(0));
    await cleanupStaleRealtimeCaptureTemps(root, 0);
    await expect(stat(stale)).rejects.toThrow();
  });
});
