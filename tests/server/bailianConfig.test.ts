import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readBailianApiKey, readBailianModel, readDirectorTimeoutMs } from '../../src/server/generationRoute';

describe('Bailian runtime configuration', () => {
  it('reads the director model from the project env file', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'cuecut-env-'));
    const envPath = join(directory, '.env');
    try {
      await writeFile(envPath, 'model=qwen3.8-flash\n', 'utf8');
      await expect(readBailianModel(envPath)).resolves.toBe('qwen3.8-flash');
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('reads a root-level API KEY assignment without exposing it', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'cuecut-key-'));
    const envPath = join(directory, '.env');
    const appData = join(directory, 'appdata');
    const previousAppData = process.env.APPDATA;
    process.env.APPDATA = appData;
    try {
      await writeFile(envPath, 'API KEY=synthetic-secret\n', 'utf8');
      await expect(readBailianApiKey(envPath)).resolves.toBe('synthetic-secret');
    } finally {
      if (previousAppData === undefined) delete process.env.APPDATA;
      else process.env.APPDATA = previousAppData;
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('accepts a bounded Director timeout override while keeping the default explicit', () => {
    const previous = process.env.CUECUT_DIRECTOR_TIMEOUT_MS;
    try {
      delete process.env.CUECUT_DIRECTOR_TIMEOUT_MS;
      expect(readDirectorTimeoutMs()).toBe(30_000);
      process.env.CUECUT_DIRECTOR_TIMEOUT_MS = '120000';
      expect(readDirectorTimeoutMs()).toBe(120_000);
      process.env.CUECUT_DIRECTOR_TIMEOUT_MS = '9999999';
      expect(readDirectorTimeoutMs()).toBe(30_000);
    } finally {
      if (previous === undefined) delete process.env.CUECUT_DIRECTOR_TIMEOUT_MS;
      else process.env.CUECUT_DIRECTOR_TIMEOUT_MS = previous;
    }
  });
});
