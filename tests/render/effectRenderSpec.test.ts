import { describe, expect, it } from 'vitest';
import { createFixtureProject } from '../../src/project/fixtures';
import { evaluateSceneAtTime, type SceneItem } from '../../src/render/scene';
import { createEffectRenderSpec, renderSpecSignature } from '../../src/render/effectRenderSpec';

describe('shared effect render spec', () => {
  it('produces different structural signatures for the first five effect families', () => {
    const project = createFixtureProject();
    const items: SceneItem[] = [
      evaluateSceneAtTime(project, 6).items.find((item) => item.effectId === 'fx-ring')!,
      { ...evaluateSceneAtTime(project, 6).items.find((item) => item.effectId === 'fx-quote')!, visualKind: 'list' },
      { ...evaluateSceneAtTime(project, 6).items.find((item) => item.effectId === 'fx-quote')!, visualKind: 'quote' },
      { ...evaluateSceneAtTime(project, 6).items.find((item) => item.effectId === 'fx-quote')!, visualKind: 'chart' },
      { ...evaluateSceneAtTime(project, 6).items.find((item) => item.effectId === 'fx-quote')!, visualKind: 'highlight' },
    ];

    const specs = items.map(createEffectRenderSpec);
    expect(new Set(specs.map(renderSpecSignature)).size).toBe(5);
    expect(specs.map((spec) => spec.primitives.map((primitive) => primitive.kind))).toEqual([
      ['panel', 'ring', 'number', 'text'],
      ['panel', 'accent-bar', 'list', 'text'],
      ['panel', 'quote-mark', 'text'],
      ['panel', 'bars', 'text'],
      ['panel', 'outline', 'underline', 'text'],
    ]);
  });
});
