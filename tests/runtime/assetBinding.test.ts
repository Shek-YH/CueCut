import { describe, expect, it } from 'vitest';
import { createFixtureProject } from '../../src/project/fixtures';
import { evaluateSceneAtTime } from '../../src/render/scene';
import { createEffectRenderSpec } from '../../src/render/effectRenderSpec';

describe('visual asset runtime binding', () => {
  it('preserves a serializable ProjectAssetRef through SceneFrame and RenderSpec', () => {
    const project = createFixtureProject();
    project.effects[0]!.asset = { assetId: 'ai_robot_assistant', source: 'generated', projectAssetRef: '/assets/ai_robot_assistant.trimmed.png' };

    const item = evaluateSceneAtTime(project, 6).items.find((entry) => entry.effectId === 'fx-ring');
    const spec = item ? createEffectRenderSpec(item) : null;

    expect(item?.asset).toEqual({ assetId: 'ai_robot_assistant', source: 'generated', projectAssetRef: '/assets/ai_robot_assistant.trimmed.png' });
    expect(spec?.primitives).toContainEqual({ kind: 'image', role: 'asset' });
  });
});
