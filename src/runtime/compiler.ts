import { findEffectTemplate } from '../effects/templateRegistry';
import { compileMotionIntent, type CompiledMotion } from '../packaging-motion/compiler';
import type { EffectInstance, ProjectComposition } from '../project/schema';
import { canonicalRuntimeItemSchema } from './schema';
import type { CanonicalRuntimeItem } from './types';

function normalizedVariantId(variantId: string): string {
  return variantId.replace(/^pack:/, '');
}

function contentProvenance(content: EffectInstance['content']): { keyClaim?: string; evidenceText?: string } {
  const value = content.provenance;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const provenance = value as Record<string, unknown>;
  return {
    keyClaim: typeof provenance.keyClaim === 'string' && provenance.keyClaim.trim() ? provenance.keyClaim : undefined,
    evidenceText: typeof provenance.evidenceText === 'string' && provenance.evidenceText.trim() ? provenance.evidenceText : undefined,
  };
}

function stableSeed(value: string): number {
  let seed = 17;
  for (const character of value) seed = (seed * 31 + character.charCodeAt(0)) | 0;
  return seed;
}

function compileLegacyMotion(effect: EffectInstance): CompiledMotion {
  const phase = (motionId: string, durationSec: number, enter: boolean) => ({
    motionId,
    durationSec,
    ease: 'linear',
    keyframes: enter ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }],
  });
  return {
    seed: stableSeed(effect.effectId),
    enter: phase(effect.motion.enter.motionId, effect.motion.enter.durationSec, true),
    emphasis: phase('none', 0.01, true),
    exit: phase(effect.motion.exit.motionId, effect.motion.exit.durationSec, false),
  };
}

function compileEffect(effect: EffectInstance, project: ProjectComposition): CanonicalRuntimeItem {
  const template = findEffectTemplate(effect.familyId, effect.variantId);
  const variantId = normalizedVariantId(effect.variantId);
  const segment = project.segments.find((item) => item.segmentId === effect.segmentId);
  const provenance = contentProvenance(effect.content);
  const item = {
    runtimeId: effect.effectId,
    sourceEffectId: effect.effectId,
    segmentId: effect.segmentId,
    template: {
      effectTemplateId: template?.effectTemplateId ?? `${effect.familyId}:${variantId}`,
      rendererId: template?.rendererId ?? effect.familyId,
      familyId: effect.familyId,
      variantId,
    },
    content: { ...effect.content },
    ...(effect.asset ? { asset: { ...effect.asset } } : {}),
    layout: {
      nx: effect.layout.nx,
      ny: effect.layout.ny,
      nw: effect.layout.nw,
      nh: effect.layout.nh,
      anchor: effect.layout.anchor,
      zone: effect.userFlags.lockedZone ?? effect.layout.preferredSide,
      zIndex: effect.zIndex,
    },
    time: { ...effect.time },
    motion: effect.motion.compiled ?? compileLegacyMotion(effect),
    appearance: { ...effect.appearance, opacity: 1 },
    ...(effect.sfx ? { sfx: { ...effect.sfx } } : {}),
    provenance: {
      sourceSubtitleIds: [...(segment?.sourceSubtitleIds ?? [])],
      ...provenance,
      ...(segment?.selectionReason ? { selectionReason: segment.selectionReason } : {}),
    },
  } satisfies CanonicalRuntimeItem;
  return canonicalRuntimeItemSchema.parse(item);
}

export function compileProjectToRuntime(project: ProjectComposition): CanonicalRuntimeItem[] {
  return project.effects.map((effect) => compileEffect(effect, project));
}
