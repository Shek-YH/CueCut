import { describe, expect, it } from 'vitest';
import { compileMotionIntent } from '../../src/packaging-motion/compiler';
import { evaluateCompiledMotion, evaluateMotion, type MotionFrame } from '../../src/motions/runtime';
import type { CompiledMotion } from '../../src/packaging-motion/compiler';

const dims = { width: 1920, height: 1080 };

describe('evaluateCompiledMotion 缓动保真', () => {
  it('back.out 入场 scale 在中点过冲高于线性值', () => {
    const compiled = compileMotionIntent({ entrance: 'scale_punch', emphasis: 'scale_pulse', exit: 'scale_out' }, { seed: 1, durationSec: 1 });
    const frame = evaluateCompiledMotion(compiled, 'enter', 0.5, dims);
    const linear = 0.6 + (1 - 0.6) * 0.5; // 线性插值基准
    expect(frame.scale).toBeGreaterThan(linear);
  });

  it('expo.out 在 p=0.3 的插值参数大于线性 p=0.3', () => {
    const compiled: CompiledMotion = {
      seed: 1,
      enter: { motionId: 'x', durationSec: 1, ease: 'expo.out', keyframes: [{ clipProgress: 0 }, { clipProgress: 1 }] },
      emphasis: { motionId: 'x', durationSec: 1, ease: 'linear', keyframes: [{ progress: 0 }] },
      exit: { motionId: 'x', durationSec: 1, ease: 'linear', keyframes: [{ opacity: 1 }, { opacity: 0 }] },
    };
    const frame = evaluateCompiledMotion(compiled, 'enter', 0.3, dims);
    expect(frame.clipProgress).toBeGreaterThan(0.3); // 0.875 > 0.3
  });

  it('未知 ease 不抛错，退化为 linear', () => {
    const compiled: CompiledMotion = {
      seed: 1,
      enter: { motionId: 'x', durationSec: 1, ease: 'unknown-ease', keyframes: [{ clipProgress: 0, opacity: 0 }, { clipProgress: 1, opacity: 1 }] },
      emphasis: { motionId: 'x', durationSec: 1, ease: 'linear', keyframes: [{ progress: 0 }] },
      exit: { motionId: 'x', durationSec: 1, ease: 'linear', keyframes: [{ opacity: 1 }, { opacity: 0 }] },
    };
    expect(() => evaluateCompiledMotion(compiled, 'enter', 0.5, dims)).not.toThrow();
    const frame = evaluateCompiledMotion(compiled, 'enter', 0.5, dims);
    expect(frame.clipProgress).toBeCloseTo(0.5, 5);
  });
});

describe('evaluateCompiledMotion 语义属性透传', () => {
  it('wipe_left 入场的 clipProgress 随 p 从 0→1 单调递增且非 undefined', () => {
    const compiled = compileMotionIntent({ entrance: 'wipe_left', emphasis: 'glow', exit: 'wipe_out' }, { seed: 1, durationSec: 1 });
    const samples = [0, 0.25, 0.5, 0.75, 1].map((p) => evaluateCompiledMotion(compiled, 'enter', p, dims).clipProgress);
    expect(samples.every((v) => v !== undefined)).toBe(true);
    expect(samples[0]).toBe(0);
    expect(samples[samples.length - 1]).toBe(1);
    for (let i = 1; i < samples.length; i += 1) expect(samples[i]!).toBeGreaterThanOrEqual(samples[i - 1]!);
  });

  it('emphasis 相位的 glow 在 p=0.5 时 > 0', () => {
    const compiled = compileMotionIntent({ entrance: 'wipe_left', emphasis: 'glow', exit: 'wipe_out' }, { seed: 1, durationSec: 1 });
    const frame = evaluateCompiledMotion(compiled, 'enter', 0.5, dims, 'emphasis');
    expect(frame.glow).toBeGreaterThan(0);
  });
});

describe('pack 语义选型不再退化为四档哈希', () => {
  // 每个 motionCategory 各取一个真实 adapterId（避免被 family 微调合并成同 profile 而相撞）
  const ids = [
    'pack:cuecut-cause-effect', // Fade
    'pack:cuecut-progress-steps', // Scale（family 不在 ticker 名单内）
    'pack:cuecut-key-point', // Pop
    'pack:cuecut-app-window', // Slide
    'pack:cuecut-checklist', // ListStagger
    'pack:cuecut-loading-dots', // Ticker
  ];

  it('6 个不同 motionCategory 的 enter 帧两两不完全相同', () => {
    const frames = ids.map((id) => evaluateMotion(id, 'enter', 0.5)) as MotionFrame[];
    for (let i = 0; i < frames.length; i += 1) {
      for (let j = i + 1; j < frames.length; j += 1) {
        expect(frames[i]).not.toEqual(frames[j]);
      }
    }
  });

  it('Ticker 类条目的 progress 有值', () => {
    const frame = evaluateMotion('pack:cuecut-loading-dots', 'enter', 0.5) as MotionFrame;
    expect(frame.progress).toBeDefined();
    expect(frame.progress!).toBeGreaterThan(0);
  });

  it('未知 pack motion 仍抛 Unknown motion', () => {
    expect(() => evaluateMotion('pack:cuecut-not-registered', 'enter', 0.5)).toThrow(/Unknown motion/);
  });
});
