export type MotionCategory = 'text' | 'number' | 'list' | 'motion-layer' | 'pack-effect' | 'legacy';
export type MotionRole = 'enter' | 'exit';
export type TextAlign = 'left' | 'center' | 'right';
export type NumberDirection = 'up' | 'down';

export interface MotionPosition {
  x: number;
  y: number;
}

export interface CommonMotionParams {
  start: number;
  duration: number;
  position: MotionPosition;
  scale: number;
  opacity: number;
  fontSize: number;
  fontWeight: number;
  textColor: string;
  accentColor: string;
  backgroundColor: string;
}

export interface TextMotionParams {
  text: string;
  align: TextAlign;
  letterSpacing: number;
  lineHeight: number;
  maxWidth: number;
}

export interface NumberMotionParams {
  value: number;
  startValue: number;
  decimalPlaces: number;
  direction: NumberDirection;
  delay: number;
  prefix: string;
  suffix: string;
  align: TextAlign;
}

export interface ListMotionParams {
  items: string[];
  itemGap: number;
  stagger: number;
  visibleCount: number;
}

export interface MotionParameterSet {
  common: CommonMotionParams;
  text?: TextMotionParams;
  number?: NumberMotionParams;
  list?: ListMotionParams;
}

export type PartialMotionParameterSet = {
  common?: Partial<CommonMotionParams> & { position?: Partial<MotionPosition> };
  text?: Partial<TextMotionParams>;
  number?: Partial<NumberMotionParams>;
  list?: Partial<ListMotionParams>;
};

export const defaultCommonMotionParams: CommonMotionParams = {
  start: 0,
  duration: 0.6,
  position: { x: 0.5, y: 0.5 },
  scale: 1,
  opacity: 1,
  fontSize: 48,
  fontWeight: 700,
  textColor: '#FFFFFF',
  accentColor: '#FACC15',
  backgroundColor: '#000000',
};

export const defaultTextMotionParams: TextMotionParams = {
  text: '',
  align: 'center',
  letterSpacing: 0,
  lineHeight: 1.2,
  maxWidth: 0.9,
};

export const defaultNumberMotionParams: NumberMotionParams = {
  value: 0,
  startValue: 0,
  decimalPlaces: 0,
  direction: 'up',
  delay: 0,
  prefix: '',
  suffix: '',
  align: 'center',
};

export const defaultListMotionParams: ListMotionParams = {
  items: [],
  itemGap: 16,
  stagger: 0.08,
  visibleCount: 0,
};

export const defaultMotionParams: MotionParameterSet = {
  common: defaultCommonMotionParams,
  text: defaultTextMotionParams,
  number: defaultNumberMotionParams,
  list: defaultListMotionParams,
};

function finiteOr(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeCommon(input: PartialMotionParameterSet['common'] | undefined, base: CommonMotionParams): CommonMotionParams {
  return {
    start: Math.max(0, finiteOr(input?.start, base.start)),
    duration: Math.max(0.01, finiteOr(input?.duration, base.duration)),
    position: {
      x: clamp(finiteOr(input?.position?.x, base.position.x), 0, 1),
      y: clamp(finiteOr(input?.position?.y, base.position.y), 0, 1),
    },
    scale: clamp(finiteOr(input?.scale, base.scale), 0.01, 4),
    opacity: clamp(finiteOr(input?.opacity, base.opacity), 0, 1),
    fontSize: clamp(finiteOr(input?.fontSize, base.fontSize), 1, 512),
    fontWeight: clamp(finiteOr(input?.fontWeight, base.fontWeight), 100, 900),
    textColor: input?.textColor ?? base.textColor,
    accentColor: input?.accentColor ?? base.accentColor,
    backgroundColor: input?.backgroundColor ?? base.backgroundColor,
  };
}

function normalizeText(input: PartialMotionParameterSet['text'] | undefined, base: TextMotionParams): TextMotionParams {
  return {
    text: input?.text ?? base.text,
    align: input?.align ?? base.align,
    letterSpacing: finiteOr(input?.letterSpacing, base.letterSpacing),
    lineHeight: Math.max(0.1, finiteOr(input?.lineHeight, base.lineHeight)),
    maxWidth: clamp(finiteOr(input?.maxWidth, base.maxWidth), 0.05, 1),
  };
}

function normalizeNumber(input: PartialMotionParameterSet['number'] | undefined, base: NumberMotionParams): NumberMotionParams {
  return {
    value: finiteOr(input?.value, base.value),
    startValue: finiteOr(input?.startValue, base.startValue),
    decimalPlaces: Math.round(clamp(finiteOr(input?.decimalPlaces, base.decimalPlaces), 0, 6)),
    direction: input?.direction ?? base.direction,
    delay: Math.max(0, finiteOr(input?.delay, base.delay)),
    prefix: input?.prefix ?? base.prefix,
    suffix: input?.suffix ?? base.suffix,
    align: input?.align ?? base.align,
  };
}

function normalizeList(input: PartialMotionParameterSet['list'] | undefined, base: ListMotionParams): ListMotionParams {
  const items = input?.items ?? base.items;
  return {
    items: [...items],
    itemGap: Math.max(0, finiteOr(input?.itemGap, base.itemGap)),
    stagger: Math.max(0, finiteOr(input?.stagger, base.stagger)),
    visibleCount: Math.max(0, Math.floor(finiteOr(input?.visibleCount, base.visibleCount))),
  };
}

export function normalizeMotionParams(
  input: PartialMotionParameterSet = {},
  base: MotionParameterSet = defaultMotionParams,
): MotionParameterSet {
  return {
    common: normalizeCommon(input.common, base.common),
    text: normalizeText(input.text, base.text ?? defaultTextMotionParams),
    number: normalizeNumber(input.number, base.number ?? defaultNumberMotionParams),
    list: normalizeList(input.list, base.list ?? defaultListMotionParams),
  };
}

export function formatMotionNumber(value: number, decimalPlaces: number, prefix = '', suffix = ''): string {
  const safeDecimals = Math.round(clamp(decimalPlaces, 0, 6));
  const rounded = Number.isFinite(value) ? value : 0;
  return `${prefix}${rounded.toLocaleString('en-US', {
    minimumFractionDigits: safeDecimals,
    maximumFractionDigits: safeDecimals,
  })}${suffix}`;
}
