import { describe, expect, it } from 'vitest';
import { createFixtureProject } from '../../src/project/fixtures';
import { cueCutPackagingBundleSchema } from '../../src/contracts/packagingBundle';

const plan = { schemaVersion: '1.0', projectId: 'external-project', canvas: { width: 1920, height: 1080, aspectRatio: '16:9', fps: 30 }, globalStyle: { visualStyle: 'clean-tech', energy: 0.5, density: 'auto', paletteIntent: 'brand', motionIntensity: 0.5 }, timeline: [], constraints: { maxConcurrentOverlays: 2, allowBehindSubject: false, subjectAvoidPadding: 0.1, edgeInsets: { top: 0.04, bottom: 0.08, left: 0.05, right: 0.05 } }, exportHints: { formats: ['mp4'], transparent: false } };

describe('CueCut packaging bundle schema', () => {
  it('accepts plan and project modes with safe local assets', () => {
    expect(cueCutPackagingBundleSchema.parse({ schema: 'cuecut.packaging-bundle', version: 1, mode: 'plan', packagingPlan: plan, assets: [{ assetId: 'ai_robot', fileName: 'ai-robot.png', kind: 'generated', mimeType: 'image/png', required: true }] })).toMatchObject({ mode: 'plan' });
    expect(cueCutPackagingBundleSchema.parse({ schema: 'cuecut.packaging-bundle', version: 1, mode: 'project', composition: createFixtureProject(), assets: [] })).toMatchObject({ mode: 'project' });
  });

  it('rejects unsafe file paths and API key fields', () => {
    expect(cueCutPackagingBundleSchema.safeParse({ schema: 'cuecut.packaging-bundle', version: 1, mode: 'plan', packagingPlan: plan, assets: [{ assetId: 'robot', fileName: '../secret.png', kind: 'generated', required: true }] })).toHaveProperty('success', false);
    expect(cueCutPackagingBundleSchema.safeParse({ schema: 'cuecut.packaging-bundle', version: 1, mode: 'plan', packagingPlan: plan, assets: [], apiKey: 'secret' })).toHaveProperty('success', false);
  });
});
