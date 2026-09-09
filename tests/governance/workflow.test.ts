import { describe, expect, it } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import path from 'node:path';

describe('ledger workflow control plane', () => {
  it('checks the current effects DAG and reports the ready queue', () => {
    const script = path.join(process.cwd(), 'scripts', 'workflow.mjs');
    const output = execFileSync(process.execPath, [script, 'check'], { encoding: 'utf8' });

    expect(output).toContain('WORKFLOW_CHECK: PASS');
    expect(output).toContain('IN_PROGRESS: WI-016, WI-020');
    expect(output).toContain('P0_GATE: IN_PROGRESS');
    expect(output).toContain('READY_QUEUE: none');
  });

  it('fails the explicit release gate while P0 descendants remain open', () => {
    const script = path.join(process.cwd(), 'scripts', 'workflow.mjs');
    const result = spawnSync(process.execPath, [script, 'release'], { encoding: 'utf8' });

    expect(result.status).not.toBe(0);
    expect(result.stdout).toContain('P0_GATE: IN_PROGRESS');
  });
});
