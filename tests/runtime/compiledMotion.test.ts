import { describe, expect, it } from 'vitest';
import { applyResolvedPackagingToProject } from '../../src/packaging/apply';
import { resolvePackagingPlan } from '../../src/packaging/resolve';
import { createFixtureProject } from '../../src/project/fixtures';
import { evaluateSceneAtTime } from '../../src/render/scene';

function planWithMotion(entrance: 'slide_left' | 'slide_right', exit: 'slide_out_right') {
  return {
    schemaVersion: '1.0' as const,
    projectId: 'runtime-motion-test',
    canvas: { width: 1920, height: 1080, aspectRatio: '16:9', fps: 30 },
    globalStyle: { visualStyle: 'clean-tech', energy: 0.5, density: 'auto' as const, paletteIntent: 'brand', motionIntensity: 0.5 },
    timeline: [{
      id: 'motion-overlay', startSec: 1, endSec: 4, intent: 'directional motion', category: 'headline' as const,
      content: { text: 'direction' }, importance: 0.8,
      visualIntent: { style: 'clean-tech', energy: 0.5, emphasis: 'strong' as const },
      motionIntent: { entrance, emphasis: 'none' as const, exit },
      placementIntent: { preferredZones: ['upper-left' as const], subjectRelation: 'avoid' as const, anchor: 'scene-safe' as const },
      constraints: { maxLines: 2, mustRemainReadable: true, mayOverlapSubtitle: false },
    }],
    constraints: { maxConcurrentOverlays: 2, allowBehindSubject: false, subjectAvoidPadding: 0.1, edgeInsets: { top: 0.04, bottom: 0.08, left: 0.05, right: 0.05 } },
    exportHints: { formats: ['mp4' as const], transparent: false },
  };
}

describe('compiled motion runtime path', () => {
  it('preserves directional entrance and exit intents through apply into SceneFrame', () => {
    const leftProject = applyResolvedPackagingToProject(createFixtureProject(), resolvePackagingPlan(planWithMotion('slide_left', 'slide_out_right')));
    const rightProject = applyResolvedPackagingToProject(createFixtureProject(), resolvePackagingPlan(planWithMotion('slide_right', 'slide_out_right')));

    const leftEffect = leftProject.effects.find((effect) => effect.effectId === 'packaging-motion-overlay');
    const rightEffect = rightProject.effects.find((effect) => effect.effectId === 'packaging-motion-overlay');
    expect(leftEffect?.motion.enter.motionId).toBe('slide_left');
    expect(leftEffect?.motion.exit.motionId).toBe('slide_out_right');
    expect(leftEffect?.motion.compiled?.enter.motionId).toBe('slide_left');

    const leftFrame = evaluateSceneAtTime(leftProject, 1).items.find((item) => item.effectId === 'packaging-motion-overlay');
    const rightFrame = evaluateSceneAtTime(rightProject, 1).items.find((item) => item.effectId === 'packaging-motion-overlay');
    expect(leftFrame?.translate.x).toBeLessThan(0);
    expect(rightFrame?.translate.x).toBeGreaterThan(0);

    const exitFrame = evaluateSceneAtTime(leftProject, 3.99).items.find((item) => item.effectId === 'packaging-motion-overlay');
    expect(exitFrame?.translate.x).toBeGreaterThan(0);
  });
});
