import { findEffectDefinition } from '../effects/registry';
import { evaluateMotion } from '../motions/runtime';
import type { EffectInstance, ProjectComposition } from '../project/schema';

export type ScenePhase = 'hidden' | 'enter' | 'active' | 'exit';

export type SceneContent =
  | { kind: 'text'; text: string }
  | { kind: 'number'; value: number; label: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'motion-layer'; label: string };

export interface SceneItem {
  effectId: string;
  variantId: string;
  phase: ScenePhase;
  visible: boolean;
  content: SceneContent;
  visualTags: string[];
  layout: Pick<EffectInstance['layout'], 'nx' | 'ny' | 'nw' | 'nh' | 'scale'>;
  opacity: number;
  translate: { x: number; y: number };
  scale: number;
  rotation: number;
  blur: number;
  appearance: EffectInstance['appearance'];
  zIndex: number;
}

export interface SceneFrame {
  timeSec: number;
  items: SceneItem[];
  activeEffectIds: string[];
}

function contentForEffect(effect: EffectInstance): SceneContent {
  const items = effect.content.items;
  if (Array.isArray(items)) return { kind: 'list', items: items.map(String) };
  const definition = findEffectDefinition(effect.familyId, effect.variantId);
  if (effect.familyId === 'numeric' || definition?.category === 'number' || typeof effect.content.value === 'number') {
    const value = Number(effect.content.value);
    return { kind: 'number', value: Number.isFinite(value) ? value : 0, label: String(effect.content.label ?? effect.content.headline ?? '') };
  }
  const text = effect.content.text ?? effect.content.headline ?? effect.content.titleText ?? effect.content.quoteText;
  if (text !== undefined) return { kind: 'text', text: String(text) };
  return { kind: 'motion-layer', label: effect.familyId };
}

function visualTagsForEffect(effect: EffectInstance): string[] {
  return findEffectDefinition(effect.familyId, effect.variantId)?.visualTags ?? [];
}

function phaseForEffect(effect: EffectInstance, timeSec: number): { phase: ScenePhase; progress: number } {
  const { startSec, endSec } = effect.time;
  if (timeSec < startSec || timeSec >= endSec) return { phase: 'hidden', progress: 1 };
  const enterDuration = Math.min(effect.motion.enter.durationSec, endSec - startSec);
  if (timeSec < startSec + enterDuration) return { phase: 'enter', progress: (timeSec - startSec) / enterDuration };
  const exitDuration = Math.min(effect.motion.exit.durationSec, endSec - startSec);
  if (timeSec >= endSec - exitDuration) return { phase: 'exit', progress: (timeSec - (endSec - exitDuration)) / exitDuration };
  return { phase: 'active', progress: 1 };
}

export function evaluateSceneAtTime(project: ProjectComposition, timeSec: number): SceneFrame {
  const safeTime = Number.isFinite(timeSec) ? Math.max(0, timeSec) : 0;
  const effectItems = project.effects.map((effect) => {
    const { phase, progress } = phaseForEffect(effect, safeTime);
    if (phase === 'hidden') {
      return {
        effectId: effect.effectId,
        variantId: effect.variantId,
        phase,
        visible: false,
        content: contentForEffect(effect),
        visualTags: visualTagsForEffect(effect),
        layout: { nx: effect.layout.nx, ny: effect.layout.ny, nw: effect.layout.nw, nh: effect.layout.nh, scale: effect.layout.scale },
        opacity: 0,
        translate: { x: 0, y: 0 },
        scale: effect.layout.scale,
        rotation: 0,
        blur: 0,
        appearance: effect.appearance,
        zIndex: effect.zIndex,
      } satisfies SceneItem;
    }
    const role = phase === 'exit' ? 'exit' : 'enter';
    const motion = effect.motion[role];
    const motionFrame = phase === 'active'
      ? evaluateMotion('fade', 'enter', 1)
      : evaluateMotion(motion.motionId, role, progress, { common: { duration: motion.durationSec } });
    return {
      effectId: effect.effectId,
      variantId: effect.variantId,
      phase,
        visible: true,
      content: contentForEffect(effect),
      visualTags: visualTagsForEffect(effect),
      layout: { nx: effect.layout.nx, ny: effect.layout.ny, nw: effect.layout.nw, nh: effect.layout.nh, scale: effect.layout.scale },
      opacity: motionFrame.opacity,
      translate: { x: motionFrame.translateX, y: motionFrame.translateY },
      scale: effect.layout.scale * motionFrame.scale,
      rotation: motionFrame.rotationDeg,
      blur: motionFrame.blurPx ?? 0,
      appearance: effect.appearance,
      zIndex: effect.zIndex,
    } satisfies SceneItem;
  });
  const subtitleItems: SceneItem[] = project.subtitles.map((subtitle) => {
    const visible = safeTime >= subtitle.startSec && safeTime < subtitle.endSec;
    return {
      effectId: subtitle.id,
      variantId: 'subtitle',
      phase: visible ? 'active' : 'hidden',
      visible,
      content: { kind: 'text', text: subtitle.text },
      visualTags: ['Text'],
      layout: { nx: 0.05, ny: 0.78, nw: 0.9, nh: 0.17, scale: 1 },
      opacity: visible ? 1 : 0,
      translate: { x: 0, y: 0 },
      scale: 1,
      rotation: 0,
      blur: 0,
      appearance: { accent: project.project.palette.primary, theme: 'dark' },
      zIndex: 100,
    };
  });
  const items = [...effectItems, ...subtitleItems];
  return { timeSec: safeTime, items, activeEffectIds: effectItems.filter((item) => item.visible && item.opacity > 0).map((item) => item.effectId) };
}
