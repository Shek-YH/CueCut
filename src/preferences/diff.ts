import type { ProjectComposition } from '../project/schema';

export type PreferenceChangeKind = 'coordinate' | 'variant' | 'motion' | 'color' | 'sfx' | 'timing' | 'delete' | 'add';

export interface PreferenceChange {
  effectId: string;
  kind: PreferenceChangeKind;
  before: unknown;
  after: unknown;
}

export function diffCompositions(initial: ProjectComposition, final: ProjectComposition): PreferenceChange[] {
  const changes: PreferenceChange[] = [];
  const initialEffects = new Map(initial.effects.map((effect) => [effect.effectId, effect]));
  const finalEffects = new Map(final.effects.map((effect) => [effect.effectId, effect]));

  initialEffects.forEach((before, effectId) => {
    const after = finalEffects.get(effectId);
    if (!after) {
      changes.push({ effectId, kind: 'delete', before, after: null });
      return;
    }
    if (before.variantId !== after.variantId) changes.push({ effectId, kind: 'variant', before: before.variantId, after: after.variantId });
    if (JSON.stringify(before.layout) !== JSON.stringify(after.layout)) changes.push({ effectId, kind: 'coordinate', before: before.layout, after: after.layout });
    if (JSON.stringify(before.motion) !== JSON.stringify(after.motion)) changes.push({ effectId, kind: 'motion', before: before.motion, after: after.motion });
    if (before.appearance.accent !== after.appearance.accent) changes.push({ effectId, kind: 'color', before: before.appearance.accent, after: after.appearance.accent });
    if (JSON.stringify(before.sfx) !== JSON.stringify(after.sfx)) changes.push({ effectId, kind: 'sfx', before: before.sfx, after: after.sfx });
    if (JSON.stringify(before.time) !== JSON.stringify(after.time)) changes.push({ effectId, kind: 'timing', before: before.time, after: after.time });
  });

  finalEffects.forEach((after, effectId) => {
    if (!initialEffects.has(effectId)) changes.push({ effectId, kind: 'add', before: null, after });
  });

  return changes;
}

