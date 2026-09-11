import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';

export interface SettingsSecretStore {
  get(name: string): string | null;
  has(name: string): boolean;
  set(name: string, value: string): void;
}

function defaultPath(): string {
  const appData = process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming');
  return join(appData, 'CueCut3', 'secrets.json');
}

export function createUserSecretStore(filePath = defaultPath()): SettingsSecretStore {
  const read = (): Record<string, string> => {
    if (!existsSync(filePath)) return {};
    try {
      const value = JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
      return value && typeof value === 'object' && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).filter(([, item]) => typeof item === 'string')) : {};
    } catch {
      return {};
    }
  };
  const write = (value: Record<string, string>): void => {
    mkdirSync(dirname(filePath), { recursive: true });
    const tempPath = filePath + '.tmp';
    writeFileSync(tempPath, JSON.stringify(value, null, 2), { encoding: 'utf8', mode: 0o600 });
    renameSync(tempPath, filePath);
    try { chmodSync(filePath, 0o600); } catch { /* Windows ACLs are managed by the user profile. */ }
  };
  return {
    get(name) { return read()[name] ?? null; },
    has(name) { return Boolean(read()[name]); },
    set(name, value) { if (!value.trim()) throw new Error('Secret value cannot be empty'); const next = read(); next[name] = value.trim(); write(next); },
  };
}
