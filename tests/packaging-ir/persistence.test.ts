import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadPackagingPlan, savePackagingPlan } from '../../src/packaging-ir/persistence';

const plan = {
  schemaVersion: '1.0' as const,
  projectId: 'project-1',
  canvas: { width: 1080, height: 1920, aspectRatio: '9:16', fps: 30 },
  globalStyle: { visualStyle: 'clean-tech', energy: 0.5, density: 'auto' as const, paletteIntent: 'brand', motionIntensity: 0.5 },
  timeline: [],
  constraints: { maxConcurrentOverlays: 2, allowBehindSubject: false, subjectAvoidPadding: 0.1, edgeInsets: { top: 0.04, bottom: 0.08, left: 0.05, right: 0.05 } },
  exportHints: { formats: ['mp4' as const], transparent: false },
};

describe('packaging plan persistence', () => {
  it('saves and loads a validated plan atomically under ai/packaging-plan.json', () => {
    const root = mkdtempSync(join(tmpdir(), 'cuecut-packaging-'));
    savePackagingPlan(root, plan);
    expect(loadPackagingPlan(root)).toEqual(plan);
    expect(readFileSync(join(root, 'ai', 'packaging-plan.json'), 'utf8')).toContain('project-1');
  });

  it('keeps the last valid plan when an invalid replacement is rejected', () => {
    const root = mkdtempSync(join(tmpdir(), 'cuecut-packaging-'));
    savePackagingPlan(root, plan);
    expect(() => savePackagingPlan(root, { ...plan, schemaVersion: 'bad' } as never)).toThrow();
    expect(loadPackagingPlan(root)).toEqual(plan);
  });
});
