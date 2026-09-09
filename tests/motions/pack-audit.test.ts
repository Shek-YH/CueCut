import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const inventoryPath = resolve(process.cwd(), 'docs/audit/MOTION_PACK_INVENTORY.md');

describe('motion pack audit evidence', () => {
  it('records every supplied zip with a SHA256 and terminal status', () => {
    expect(existsSync(inventoryPath)).toBe(true);
    const inventory = readFileSync(inventoryPath, 'utf8');
    const rows = inventory.split('\n').filter((line) => line.startsWith('| CueCut2_TalkingHead_Effects_Pack_'));

    expect(rows).toHaveLength(7);
    expect(rows.every((row) => /[A-F0-9]{64}/.test(row))).toBe(true);
    expect(rows.every((row) => /FORMALLY_INSTALLED|QUARANTINED_[A-Z_]+/.test(row))).toBe(true);
  });
});
