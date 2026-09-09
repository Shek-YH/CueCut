import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

describe('ledger workflow control plane', () => {
  it('checks the current effects DAG and reports the ready queue', () => {
    const script = path.join(process.cwd(), 'scripts', 'workflow.mjs');
    const output = execFileSync(process.execPath, [script, 'check'], { encoding: 'utf8' });

    expect(output).toContain('WORKFLOW_CHECK: PASS');
    expect(output).toContain('IN_PROGRESS: WI-015');
    expect(output).toContain('READY_QUEUE: none');
  });
});
