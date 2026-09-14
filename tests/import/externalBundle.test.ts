import { describe, expect, it } from 'vitest';
import { createFixtureProject } from '../../src/project/fixtures';
import { importExternalBundle } from '../../src/import/externalBundle';

const plan = { schemaVersion: '1.0', projectId: 'external-project', canvas: { width: 1920, height: 1080, aspectRatio: '16:9', fps: 30 }, globalStyle: { visualStyle: 'clean-tech', energy: 0.5, density: 'auto', paletteIntent: 'brand', motionIntensity: 0.5 }, timeline: [], constraints: { maxConcurrentOverlays: 2, allowBehindSubject: false, subjectAvoidPadding: 0.1, edgeInsets: { top: 0.04, bottom: 0.08, left: 0.05, right: 0.05 } }, exportHints: { formats: ['mp4'], transparent: false } };

describe('external packaging import', () => {
  it('imports a plan locally without an AI request and reports bindings', () => {
    const result = importExternalBundle({ schema: 'cuecut.packaging-bundle', version: 1, mode: 'plan', packagingPlan: plan, assets: [{ assetId: 'robot', fileName: 'robot.png', kind: 'generated', required: false, mimeType: 'image/png' }] }, createFixtureProject(), [{ name: 'robot.png', type: 'image/png' }]);
    expect(result.project.effects).toHaveLength(3);
    expect(result.boundAssetCount).toBe(0);
    expect(result.missingRequiredAssetIds).toEqual([]);
  });

  it('keeps the project loadable while exposing missing required assets as partial', () => {
    const project = createFixtureProject();
    const result = importExternalBundle({ schema: 'cuecut.packaging-bundle', version: 1, mode: 'project', composition: project, assets: [{ assetId: 'robot', fileName: 'robot.png', kind: 'generated', required: true, mimeType: 'image/png' }] }, createFixtureProject(), []);
    expect(result.project.project.projectId).toBe(project.project.projectId);
    expect(result.project.subtitleSettings).toBeDefined();
    expect(result.missingRequiredAssetIds).toEqual(['robot']);
    expect(result.status).toBe('partial');
  });
});
