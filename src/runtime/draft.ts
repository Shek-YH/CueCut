import type { EffectInstance } from '../project/schema';

export function updateEffectDraftMotion(effect: EffectInstance, role: 'enter' | 'exit', update: Partial<EffectInstance['motion']['enter']>): EffectInstance {
  const { compiled: _compiled, ...motionWithoutCompiled } = effect.motion;
  return {
    ...effect,
    motion: {
      ...motionWithoutCompiled,
      [role]: { ...motionWithoutCompiled[role], ...update },
    },
  };
}
