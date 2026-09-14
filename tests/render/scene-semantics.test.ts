import { describe, expect, it } from 'vitest';
import { createFixtureProject } from '../../src/project/fixtures';
import { evaluateSceneAtTime } from '../../src/render/scene';
import { compileMotionIntent } from '../../src/packaging-motion/compiler';

describe('SceneItem 透传 compiled 语义字段', () => {
  it('enter 相位把 wipe_left 的 clipProgress 透传进 SceneItem', () => {
    const project = createFixtureProject();
    const compiled = compileMotionIntent({ entrance: 'wipe_left', emphasis: 'glow', exit: 'wipe_out' }, { seed: 1, durationSec: 1 });
    project.effects[0]!.motion.compiled = compiled;
    project.effects[0]!.motion.enter = { motionId: 'wipe_left', durationSec: compiled.enter.durationSec, intensity: 0.5 };

    const item = evaluateSceneAtTime(project, 5.9).items.find((entry) => entry.effectId === 'fx-ring');
    expect(item?.phase).toBe('enter');
    expect(item?.clipProgress).toBeDefined();
    expect(item?.clipProgress!).toBeGreaterThan(0);
  });

  it('active 相位不再恒等于 fade：emphasis glow 生效', () => {
    const project = createFixtureProject();
    const compiled = compileMotionIntent({ entrance: 'wipe_left', emphasis: 'glow', exit: 'wipe_out' }, { seed: 1, durationSec: 1 });
    project.effects[0]!.motion.compiled = compiled;
    project.effects[0]!.motion.enter = { motionId: 'wipe_left', durationSec: compiled.enter.durationSec, intensity: 0.5 };

    // 取已进入 active、且 emphasis 进度在中间的时刻（≈ 0.5）
    const enterEnd = project.effects[0]!.time.startSec + compiled.enter.durationSec;
    const t = enterEnd + compiled.emphasis.durationSec * 0.5;
    const item = evaluateSceneAtTime(project, t).items.find((entry) => entry.effectId === 'fx-ring');
    expect(item?.phase).toBe('active');
    expect(item?.glow).toBeDefined();
    expect(item?.glow!).toBeGreaterThan(0);
  });
});
