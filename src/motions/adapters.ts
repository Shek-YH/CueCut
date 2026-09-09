import { evaluateMotion, type MotionFrame } from './runtime';
import { packMotionCatalog } from './packCatalog';
import {
  defaultCommonMotionParams,
  defaultListMotionParams,
  defaultNumberMotionParams,
  defaultTextMotionParams,
  formatMotionNumber,
  normalizeMotionParams,
  type ListMotionParams,
  type MotionCategory,
  type MotionParameterSet,
  type MotionRole,
  type NumberMotionParams,
  type PartialMotionParameterSet,
  type TextMotionParams,
} from './format';

export type MotionAdapterCategory = Exclude<MotionCategory, 'legacy'>;

export interface MotionAdapterEvaluationContext {
  role: MotionRole;
  progress: number;
}

export interface MotionAdapterFrameInput {
  frame: number;
  fps: number;
  role: MotionRole;
  props?: PartialMotionParameterSet;
}

export interface MotionRenderModel {
  adapterId: string;
  category: MotionAdapterCategory;
  frame: MotionFrame;
  props: MotionParameterSet;
  text?: string;
  value?: number;
  formattedValue?: string;
  items?: string[];
  visibleItemCount?: number;
}

export interface CueCutMotionAdapter {
  id: string;
  category: MotionAdapterCategory;
  defaultProps: MotionParameterSet;
  normalizeProps(input?: PartialMotionParameterSet): MotionParameterSet;
  evaluate(input?: PartialMotionParameterSet, context?: MotionAdapterEvaluationContext): MotionRenderModel;
  evaluateAtFrame(input: MotionAdapterFrameInput): MotionRenderModel;
}

const defaultContext: MotionAdapterEvaluationContext = { role: 'enter', progress: 1 };

function clampProgress(progress: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
}

function deterministicCharacter(index: number, progressStep: number, characterSet: string): string {
  const seed = (index + 1) * 31 + progressStep * 17;
  return characterSet[Math.abs(seed) % characterSet.length] ?? '•';
}

function deterministicScramble(text: string, progress: number, characterSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
  const safeProgress = clampProgress(progress);
  const revealedCount = Math.floor(text.length * safeProgress);
  const progressStep = Math.floor(safeProgress * 1000);
  return [...text]
    .map((character, index) => {
      if (/\s/u.test(character) || index < revealedCount) return character;
      return deterministicCharacter(index, progressStep, characterSet);
    })
    .join('');
}

function defaultFor(category: MotionAdapterCategory, overrides: PartialMotionParameterSet = {}): MotionParameterSet {
  return normalizeMotionParams({
    common: { ...defaultCommonMotionParams },
    text: category === 'text' ? { ...defaultTextMotionParams } : undefined,
    number: category === 'number' ? { ...defaultNumberMotionParams } : undefined,
    list: category === 'list' ? { ...defaultListMotionParams } : undefined,
    ...overrides,
  });
}

function textModel(id: string, params: MotionParameterSet, context: MotionAdapterEvaluationContext): Partial<MotionRenderModel> {
  const text = params.text?.text ?? '';
  return {
    text: id === 'text-scramble' ? deterministicScramble(text, context.progress) : text,
  };
}

function numberModel(_id: string, params: MotionParameterSet, context: MotionAdapterEvaluationContext): Partial<MotionRenderModel> {
  const number = params.number ?? defaultNumberMotionParams;
  const common = params.common;
  const delayedProgress = clampProgress((context.progress * common.duration - number.delay) / common.duration);
  const value = number.direction === 'down'
    ? number.value + (number.startValue - number.value) * delayedProgress
    : number.startValue + (number.value - number.startValue) * delayedProgress;
  return {
    value,
    formattedValue: formatMotionNumber(value, number.decimalPlaces, number.prefix, number.suffix),
  };
}

function listModel(_id: string, params: MotionParameterSet, context: MotionAdapterEvaluationContext): Partial<MotionRenderModel> {
  const list = params.list ?? defaultListMotionParams;
  const targetCount = list.visibleCount > 0 ? Math.min(list.visibleCount, list.items.length) : list.items.length;
  const visibleItemCount = context.progress <= 0 ? 0 : Math.min(targetCount, Math.ceil(targetCount * clampProgress(context.progress)));
  return {
    items: list.items.slice(0, visibleItemCount),
    visibleItemCount,
  };
}

function createAdapter(
  id: string,
  category: MotionAdapterCategory,
  defaultProps: MotionParameterSet,
  model: (adapterId: string, params: MotionParameterSet, context: MotionAdapterEvaluationContext) => Partial<MotionRenderModel> = () => ({}),
): CueCutMotionAdapter {
  const evaluate = (input: PartialMotionParameterSet = {}, context: MotionAdapterEvaluationContext = defaultContext): MotionRenderModel => {
    const props = normalizeMotionParams(input, defaultProps);
    const safeContext = { role: context.role, progress: clampProgress(context.progress) };
    return {
      adapterId: id,
      category,
      frame: evaluateMotion(id, safeContext.role, safeContext.progress, props),
      props,
      ...model(id, props, safeContext),
    };
  };

  return {
    id,
    category,
    defaultProps,
    normalizeProps(input = {}) {
      return normalizeMotionParams(input, defaultProps);
    },
    evaluate,
    evaluateAtFrame(input) {
      const props = normalizeMotionParams(input.props, defaultProps);
      const safeFps = Number.isFinite(input.fps) && input.fps > 0 ? input.fps : 30;
      const safeFrame = Number.isFinite(input.frame) ? Math.max(0, input.frame) : 0;
      const progress = (safeFrame / safeFps - props.common.start) / props.common.duration;
      return evaluate(input.props, { role: input.role, progress });
    },
  };
}

const textAdapters: CueCutMotionAdapter[] = [
  createAdapter('text-morph', 'text', defaultFor('text'), textModel),
  createAdapter('text-roll', 'text', defaultFor('text'), textModel),
  createAdapter('text-scramble', 'text', defaultFor('text'), textModel),
  createAdapter('text-shimmer', 'text', defaultFor('text'), textModel),
  createAdapter('animated-shiny-text', 'text', defaultFor('text'), textModel),
];

const numberAdapters: CueCutMotionAdapter[] = [
  createAdapter('animated-number', 'number', defaultFor('number'), numberModel),
  createAdapter('number-ticker', 'number', defaultFor('number'), numberModel),
];

const listAdapters: CueCutMotionAdapter[] = [
  createAdapter('animated-list', 'list', defaultFor('list'), listModel),
  createAdapter('animated-group', 'list', defaultFor('list'), listModel),
];

export const motionLayerPresetIds = [
  'fade',
  'slide',
  'scale',
  'blur',
  'blur-slide',
  'zoom',
  'flip',
  'bounce',
  'rotate',
  'swing',
] as const;

const motionLayerAdapters: CueCutMotionAdapter[] = motionLayerPresetIds.map((id) =>
  createAdapter(id, 'motion-layer', normalizeMotionParams({ common: { ...defaultCommonMotionParams } })),
);

export const contentMotionAdapterRegistry: CueCutMotionAdapter[] = [...textAdapters, ...numberAdapters, ...listAdapters];
export const motionLayerAdapterRegistry: CueCutMotionAdapter[] = motionLayerAdapters;
const packDefaultProps = normalizeMotionParams({
  common: { ...defaultCommonMotionParams },
  text: { ...defaultTextMotionParams },
  number: { ...defaultNumberMotionParams },
  list: { ...defaultListMotionParams },
});

const packMotionAdapters: CueCutMotionAdapter[] = packMotionCatalog.map((entry) =>
  createAdapter(entry.adapterId, 'pack-effect', packDefaultProps, (_id, params, context) => ({
    text: params.text?.text ?? '',
    items: params.list?.items ?? [],
    visibleItemCount: context.progress <= 0 ? 0 : params.list?.items.length ?? 0,
  })),
);

export const packMotionAdapterRegistry: CueCutMotionAdapter[] = packMotionAdapters;
export const motionAdapterRegistry: CueCutMotionAdapter[] = [...contentMotionAdapterRegistry, ...motionLayerAdapterRegistry, ...packMotionAdapterRegistry];

export function findMotionAdapter(adapterId: string): CueCutMotionAdapter | undefined {
  return motionAdapterRegistry.find((adapter) => adapter.id === adapterId);
}

export function evaluateMotionAdapterAtFrame(input: MotionAdapterFrameInput & { adapterId: string }): MotionRenderModel {
  const adapter = findMotionAdapter(input.adapterId);
  if (!adapter) throw new Error(`Motion adapter must be registered: ${input.adapterId}`);
  return adapter.evaluateAtFrame(input);
}

export const evaluateAdapterAtFrame = evaluateMotionAdapterAtFrame;

export const cueCutMotionAdapters = motionAdapterRegistry;

export type { ListMotionParams, NumberMotionParams, PartialMotionParameterSet, TextMotionParams };
