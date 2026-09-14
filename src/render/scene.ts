import { findEffectDefinition } from '../effects/registry';
import { evaluateCompiledMotion, evaluateMotion, type MotionFrame } from '../motions/runtime';
import { defaultChapterNavSettings, defaultThemePalette, type EffectInstance, type ProjectComposition } from '../project/schema';

export type ScenePhase = 'hidden' | 'enter' | 'active' | 'exit';
export type SceneVisualKind = 'metric' | 'chart' | 'list' | 'quote' | 'highlight' | 'badge' | 'text' | 'chapterNav';

export type SceneContent =
  | { kind: 'text'; text: string }
  | { kind: 'number'; value: number; label: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'motion-layer'; label: string }
  | { kind: 'chapters'; items: string[]; activeIndex: number };

export interface SceneItem {
  effectId: string;
  variantId: string;
  phase: ScenePhase;
  visible: boolean;
  content: SceneContent;
  asset?: EffectInstance['asset'];
  visualTags: string[];
  visualKind: SceneVisualKind;
  layout: Pick<EffectInstance['layout'], 'nx' | 'ny' | 'nw' | 'nh' | 'scale'>;
  opacity: number;
  translate: { x: number; y: number };
  scale: number;
  rotation: number;
  blur: number;
  // 语义动效字段（按 key 透传，不存在时保持 undefined）
  clipProgress?: number;
  revealProgress?: number;
  glow?: number;
  colorProgress?: number;
  progress?: number;
  chapterProgress?: number;
  appearance: EffectInstance['appearance'];
  zIndex: number;
}

export interface SceneFrame {
  timeSec: number;
  items: SceneItem[];
  activeEffectIds: string[];
  diagnostics?: SceneDiagnostic[];
}

export interface SceneDiagnostic {
  effectId: string;
  code: 'text-overflow';
  message: string;
}

function contentForEffect(effect: EffectInstance, timeSec: number): SceneContent {
  const items = effect.content.items;
  if (Array.isArray(items)) return { kind: 'list', items: items.flatMap((item) => listItemTextAtTime(item, timeSec)) };
  const definition = findEffectDefinition(effect.familyId, effect.variantId);
  if (effect.familyId === 'numeric' || definition?.category === 'number' || typeof effect.content.value === 'number') {
    const value = Number(effect.content.value);
    return { kind: 'number', value: Number.isFinite(value) ? value : 0, label: String(effect.content.label ?? effect.content.headline ?? '') };
  }
  const text = effect.content.text ?? effect.content.headline ?? effect.content.titleText ?? effect.content.quoteText;
  if (text !== undefined) return { kind: 'text', text: String(text) };
  return { kind: 'motion-layer', label: effect.familyId };
}

function listItemTextAtTime(item: unknown, timeSec: number): string[] {
  if (typeof item === 'string') return [item];
  if (!item || typeof item !== 'object' || Array.isArray(item)) return [String(item)];
  const record = item as Record<string, unknown>;
  const text = typeof record.text === 'string' ? record.text : String(item);
  const cue = record.cue;
  if (!cue || typeof cue !== 'object' || Array.isArray(cue)) return [text];
  const startSec = (cue as Record<string, unknown>).startSec;
  return typeof startSec === 'number' && Number.isFinite(startSec) && startSec > timeSec ? [] : [text];
}

function visualTagsForEffect(effect: EffectInstance): string[] {
  return findEffectDefinition(effect.familyId, effect.variantId)?.visualTags ?? [];
}

function visualKindForEffect(effect: EffectInstance): SceneVisualKind {
  const definition = findEffectDefinition(effect.familyId, effect.variantId);
  const tags = [...visualTagsForEffect(effect), ...(definition?.semanticTags ?? [])].map((tag) => tag.toLowerCase());
  if (tags.includes('metric') || tags.includes('number') || effect.familyId === 'numeric') return 'metric';
  if (tags.includes('chart') || effect.familyId === 'chart') return 'chart';
  if (tags.includes('list') || tags.includes('steps')) return 'list';
  if (tags.includes('quote') || tags.includes('definition')) return 'quote';
  if (tags.includes('highlight') || tags.includes('pointer')) return 'highlight';
  if (tags.includes('badge') || tags.includes('icon') || tags.includes('alert')) return 'badge';
  return 'text';
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
        content: contentForEffect(effect, safeTime),
        asset: effect.asset,
        visualTags: visualTagsForEffect(effect),
        visualKind: visualKindForEffect(effect),
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
    let motionFrame: MotionFrame;
    if (phase === 'active') {
      // active 相位不再写死 fade：若 effect 带 compiled，用 emphasis 相位求值（不循环）
      if (effect.motion.compiled) {
        const enterDuration = Math.min(effect.motion.enter.durationSec, effect.time.endSec - effect.time.startSec);
        const emphasisDuration = effect.motion.compiled.emphasis.durationSec;
        const emphasisProgress = emphasisDuration > 0
          ? Math.max(0, Math.min(1, (safeTime - (effect.time.startSec + enterDuration)) / emphasisDuration))
          : 1;
        motionFrame = evaluateCompiledMotion(effect.motion.compiled, 'enter', emphasisProgress, { width: project.project.canvasWidth, height: project.project.canvasHeight }, 'emphasis');
      } else {
        motionFrame = evaluateMotion('fade', 'enter', 1);
      }
    } else if (effect.motion.compiled) {
      motionFrame = evaluateCompiledMotion(effect.motion.compiled, role, progress, { width: project.project.canvasWidth, height: project.project.canvasHeight });
    } else {
      motionFrame = evaluateMotion(motion.motionId, role, progress, { common: { duration: motion.durationSec } });
    }
    return {
      effectId: effect.effectId,
      variantId: effect.variantId,
      phase,
        visible: true,
      content: contentForEffect(effect, safeTime),
      asset: effect.asset,
      visualTags: visualTagsForEffect(effect),
      visualKind: visualKindForEffect(effect),
      layout: { nx: effect.layout.nx, ny: effect.layout.ny, nw: effect.layout.nw, nh: effect.layout.nh, scale: effect.layout.scale },
      opacity: motionFrame.opacity,
      translate: { x: motionFrame.translateX, y: motionFrame.translateY },
      scale: effect.layout.scale * motionFrame.scale,
      rotation: motionFrame.rotationDeg,
      blur: motionFrame.blurPx ?? 0,
      clipProgress: motionFrame.clipProgress,
      revealProgress: motionFrame.revealProgress,
      glow: motionFrame.glow,
      colorProgress: motionFrame.colorProgress,
      progress: motionFrame.progress,
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
      visualKind: 'text',
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
  // 防御性排序：apply.ts 会排序，但手写/外部导入的 composition 可能未排序。
  // 未排序时 chapters[0]/chapters[last] 不再等于"首章起/末章止"，导航条会整体消失。
  const chapters = project.chapters && project.chapters.length > 0
    ? [...project.chapters].sort((left, right) => left.startSec - right.startSec || left.endSec - right.endSec)
    : undefined;
  const navItems: SceneItem[] = (chapters && chapters.length > 0 && (project.project.chapterNav ?? defaultChapterNavSettings).visible)
    ? (() => {
      const firstStart = chapters[0]!.startSec;
      const lastEnd = chapters[chapters.length - 1]!.endSec;
      if (safeTime < firstStart || safeTime >= lastEnd) return [];
      // 覆盖 safeTime 的章节下标；落在章节空隙时取前一个章节（不留 undefined）
      let activeIndex = 0;
      for (let index = 0; index < chapters.length; index += 1) {
        if (safeTime >= chapters[index]!.startSec && safeTime < chapters[index]!.endSec) {
          activeIndex = index;
          break;
        }
        if (safeTime >= chapters[index]!.endSec) activeIndex = index;
      }
      const navSettings = project.project.chapterNav ?? defaultChapterNavSettings;
      const progress = (safeTime - firstStart) / Math.max(0.0001, lastEnd - firstStart);
      return [{
        effectId: 'chapter-nav',
        variantId: 'chapter-nav',
        phase: 'active' as const,
        visible: true,
        content: { kind: 'chapters', items: chapters.map((chapter) => chapter.title), activeIndex },
        visualTags: [],
        visualKind: 'chapterNav' as const,
        layout: { nx: 0.03, ny: navSettings.position === 'top' ? 0.02 : 0.93, nw: 0.94, nh: 0.06, scale: 1 },
        opacity: 1,
        translate: { x: 0, y: 0 },
        scale: 1,
        rotation: 0,
        blur: 0,
        appearance: { accent: (project.project.themePalette ?? defaultThemePalette).method, theme: 'dark' as const },
        chapterProgress: Math.max(0, Math.min(1, progress)),
        zIndex: 90,
      } satisfies SceneItem];
    })()
    : [];
  const items = [...effectItems, ...subtitleItems, ...navItems];
  return { timeSec: safeTime, items, activeEffectIds: effectItems.filter((item) => item.visible && item.opacity > 0).map((item) => item.effectId) };
}
