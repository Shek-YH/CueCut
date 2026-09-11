import { describe, expect, it } from 'vitest';
import { compileMotionIntent } from '../../src/packaging-motion/compiler';

describe('packaging motion DSL', () => {
  it('compiles finite vocabulary into repeatable seek-safe phases', () => {
    const intent = { entrance: 'scale_punch' as const, emphasis: 'scale_pulse' as const, exit: 'fade_out' as const };
    const first = compileMotionIntent(intent, { seed: 12345, durationSec: 1.2 });
    const second = compileMotionIntent(intent, { seed: 12345, durationSec: 1.2 });
    expect(first).toEqual(second);
    expect(first.enter.motionId).toBe('scale_punch');
    expect(first.exit.motionId).toBe('fade_out');
    expect(first.seed).toBe(12345);
  });

  it('rejects arbitrary keyframes and code', () => {
    expect(() => compileMotionIntent({ entrance: 'custom_keyframes', emphasis: 'none', exit: 'fade_out' } as never, { seed: 1, durationSec: 1 })).toThrow();
  });
});
