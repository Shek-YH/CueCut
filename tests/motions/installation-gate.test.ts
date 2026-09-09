import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { effectRegistry } from '../../src/effects/registry';
import { findMotion, motionRegistry } from '../../src/motions/registry';
import { packMotionCatalog } from '../../src/motions/packCatalog';
import { evaluateMotion } from '../../src/motions/runtime';

describe('PHASE 0 installation gate', () => {
  it('has seven processed zip rows and no unresolved license status', () => {
    const inventory = readFileSync(resolve(process.cwd(), 'docs/audit/MOTION_PACK_INVENTORY.md'), 'utf8');
    const rows = inventory.split('\n').filter((line) => line.startsWith('| CueCut2_TalkingHead_Effects_Pack_'));

    expect(rows).toHaveLength(7);
    expect(rows.every((row) => row.includes('FORMALLY_INSTALLED') || row.includes('QUARANTINED_'))).toBe(true);
    expect(inventory).not.toMatch(/\| (UNKNOWN|UNREVIEWED) \|/);
    const gate = JSON.parse(readFileSync(resolve(process.cwd(), 'docs/audit/MOTION_RUNTIME_GATE.json'), 'utf8')) as Record<string, unknown>;
    expect(gate).toMatchObject({ status: 'PASS', catalogCount: 87, formalMotionCount: 106, runtimeMismatchCount: 0, licenseGate: 'PASS' });
  });

  it('keeps every formal effect and motion renderable at 30fps', () => {
    const formalMotions = motionRegistry.filter((motion) => motion.adapter);
    expect(packMotionCatalog).toHaveLength(87);
    expect(formalMotions).toHaveLength(106);
    expect(effectRegistry.filter((effect) => effect.adapterId)).toHaveLength(106);
    expect(existsSync(resolve(process.cwd(), 'src/motions/_import/CueCut2_TalkingHead_Effects_Pack_v0.7'))).toBe(true);

    for (const motion of motionRegistry) {
      expect(() => evaluateMotion(motion.motionId, motion.role === 'exit' ? 'exit' : 'enter', 0.5)).not.toThrow();
      expect(findMotion(motion.motionId)?.id).toBe(motion.id);
    }
  });
});
