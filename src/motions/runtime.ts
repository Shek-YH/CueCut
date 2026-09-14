import { normalizeMotionParams, type MotionParameterSet, type PartialMotionParameterSet, type MotionRole } from './format';
import { packMotionCatalog } from './packCatalog';
import type { CompiledMotion } from '../packaging-motion/compiler';

export interface MotionFrame {
  opacity: number;
  translateX: number;
  translateY: number;
  scale: number;
  rotationDeg: number;
  blurPx?: number;
  // 语义属性：按 key 透传，不存在时保持 undefined（不填 0）
  clipProgress?: number;
  revealProgress?: number;
  glow?: number;
  colorProgress?: number;
  progress?: number;
}

function interpolateKeyframe(keyframes: Array<Record<string, number>>, key: string, progress: number, fallback: number): number {
  const values = keyframes.map((keyframe) => keyframe[key]).filter((value): value is number => value !== undefined && Number.isFinite(value));
  if (values.length === 0) return fallback;
  if (values.length === 1) return values[0]!;
  const scaled = progressValue(progress) * (values.length - 1);
  const index = Math.min(values.length - 2, Math.floor(scaled));
  return lerp(values[index]!, values[index + 1]!, scaled - index);
}

// 缓动表：t 已 clamp 到 0..1；未知 ease 退化为 linear（不抛错）
function easeValue(ease: string, t: number): number {
  const x = progressValue(t);
  switch (ease) {
    case 'linear': return x;
    case 'power2.out': return 1 - (1 - x) ** 2;
    case 'power2.in': return x ** 2;
    case 'power2.inOut': return x < 0.5 ? 2 * x * x : 1 - 2 * (1 - x) ** 2;
    case 'power3.out': return 1 - (1 - x) ** 3;
    case 'expo.out': return x >= 1 ? 1 : 1 - 2 ** (-10 * x);
    case 'sine.inOut': return 0.5 - 0.5 * Math.cos(Math.PI * x);
    case 'back.out': {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2;
    }
    default: return x;
  }
}

export function evaluateCompiledMotion(compiled: CompiledMotion, role: MotionRole, progress: number, dimensions: { width: number; height: number }, phaseOverride?: MotionRole | 'emphasis'): MotionFrame {
  // 默认按 role 取 enter/exit；传 'emphasis' 时用 emphasis 相位（保持 4 参数调用点兼容）
  const phase = phaseOverride === 'emphasis'
    ? compiled.emphasis
    : phaseOverride === 'enter' || phaseOverride === 'exit'
      ? compiled[phaseOverride]
      : role === 'enter' ? compiled.enter : compiled.exit;
  // 先按该 phase 的 ease 把进度缓动，再用 eased 进度做插值
  const eased = easeValue(phase.ease, progress);
  const semanticKey = (key: string): number | undefined => {
    const values = phase.keyframes.map((keyframe) => keyframe[key]).filter((value): value is number => value !== undefined && Number.isFinite(value));
    if (values.length === 0) return undefined;
    if (values.length === 1) return values[0]!;
    const scaled = eased * (values.length - 1);
    const index = Math.min(values.length - 2, Math.floor(scaled));
    return lerp(values[index]!, values[index + 1]!, scaled - index);
  };
  return {
    opacity: interpolateKeyframe(phase.keyframes, 'opacity', eased, role === 'enter' ? 1 : 0),
    translateX: interpolateKeyframe(phase.keyframes, 'x', eased, 0) * dimensions.width,
    translateY: interpolateKeyframe(phase.keyframes, 'y', eased, 0) * dimensions.height,
    scale: interpolateKeyframe(phase.keyframes, 'scale', eased, 1),
    rotationDeg: interpolateKeyframe(phase.keyframes, 'rotation', eased, 0),
    blurPx: interpolateKeyframe(phase.keyframes, 'blur', eased, 0),
    clipProgress: semanticKey('clipProgress'),
    revealProgress: semanticKey('revealProgress'),
    glow: semanticKey('glow'),
    colorProgress: semanticKey('colorProgress'),
    progress: semanticKey('progress'),
  };
}

export interface MotionFrameInput {
  motionId: string;
  role: MotionRole;
  frame: number;
  fps: number;
  props?: PartialMotionParameterSet;
}

function progressValue(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function visibleOpacity(role: MotionRole, progress: number): number {
  return role === 'enter' ? progress : 1 - progress;
}

type PackProfile = 'fade' | 'slide' | 'scale' | 'blur' | 'pop' | 'stagger' | 'ticker';

const SLIDE_HORIZONTAL_FAMILIES = ['flow', 'timeline', 'steps', 'checklist', 'ranking', 'delta', 'beforeafter', 'versus', 'proscons'];
// 这些 family 本质是进度/数值驱动动效，强制 ticker
const TICKER_FAMILIES = ['progress', 'gauge', 'percentage', 'ranking', 'delta'];

function packProfileFor(entry: typeof packMotionCatalog[number], role: MotionRole, progress: number): MotionFrame {
  const p = progressValue(progress);
  // 1) 按 motionCategory 数据驱动选型（禁止哈希）
  let profile: PackProfile;
  switch (entry.motionCategory) {
    case 'Fade': profile = 'fade'; break;
    case 'Scale': profile = 'scale'; break;
    case 'Pop': profile = 'pop'; break;
    case 'Slide': profile = 'slide'; break;
    case 'ListStagger': profile = 'stagger'; break;
    case 'Ticker': profile = 'ticker'; break;
    default: profile = 'fade'; // 安全兜底：motionCategory 缺失/未知时退化为 fade（非哈希）
  }
  // 2) family 级确定性微调（在 profile 基础上）
  const family = entry.family;
  if (TICKER_FAMILIES.includes(family)) profile = 'ticker';
  if (family === 'Alert' || family === 'AttentionBurst') profile = 'pop';
  if (family === 'FocusReticle' || family === 'CircleFocus') profile = 'scale';

  const tags = entry.semanticTags.map((tag) => tag.toLowerCase());
  const horizontal = tags.includes('left') || tags.includes('right')
    ? true
    : tags.includes('top') || tags.includes('bottom')
      ? false
      : SLIDE_HORIZONTAL_FAMILIES.includes(family.toLowerCase());
  const distance = 520;

  if (profile === 'ticker') {
    // 进度/数值驱动：progress = eased t，opacity 恒 1，scale 恒 1
    return { opacity: 1, translateX: 0, translateY: 0, scale: 1, rotationDeg: 0, progress: easeValue('power2.out', p) };
  }
  if (profile === 'pop') {
    const overshoot = family === 'Alert' || family === 'AttentionBurst' ? 1.12 : 1.06;
    if (role === 'enter') {
      const opacity = p < 0.4 ? p / 0.4 : 1; // 0→1 在前 40% 完成
      const scale = p < 0.65 ? lerp(0.6, overshoot, p / 0.65) : lerp(overshoot, 1, (p - 0.65) / 0.35);
      return { opacity, translateX: 0, translateY: 0, scale, rotationDeg: 0 };
    }
    // exit：scale 1 → 0.94 → 0.9，opacity → 0
    const scale = p < 0.5 ? lerp(1, 0.94, p / 0.5) : lerp(0.94, 0.9, (p - 0.5) / 0.5);
    return { opacity: 1 - p, translateX: 0, translateY: 0, scale, rotationDeg: 0 };
  }
  if (profile === 'stagger' || profile === 'slide') {
    // 与 slide 同形态（水平由左侧 520px 位移入），stagger 做重映射模拟逐条延迟
    const tIn = profile === 'stagger' ? progressValue((p - 0.12) / 0.88) : p; // 无 item index 时的近似
    const pos = role === 'enter' ? lerp(-distance, 0, tIn) : lerp(0, -distance, p);
    return {
      opacity: visibleOpacity(role, role === 'enter' ? tIn : p),
      translateX: horizontal ? pos : 0,
      translateY: horizontal ? 0 : pos,
      scale: 1,
      rotationDeg: 0,
    };
  }
  if (profile === 'scale') {
    const frame: MotionFrame = {
      opacity: visibleOpacity(role, p),
      translateX: 0,
      translateY: 0,
      scale: role === 'enter' ? lerp(0.8, 1, p) : lerp(1, 0.8, p),
      rotationDeg: 0,
    };
    if (family === 'FocusReticle' || family === 'CircleFocus') frame.glow = Math.sin(Math.PI * p); // 入场扫光
    return frame;
  }
  // fade
  return { opacity: visibleOpacity(role, p), translateX: 0, translateY: 0, scale: 1, rotationDeg: 0 };
}

function applyCommon(frame: MotionFrame, params?: PartialMotionParameterSet): MotionFrame {
  if (!params) return frame;
  const common = normalizeMotionParams(params).common;
  return {
    ...frame,
    opacity: frame.opacity * common.opacity,
    scale: frame.scale * common.scale,
  };
}

function evaluateMotionProfile(motionId: string, role: MotionRole, progress: number): MotionFrame | undefined {
  const p = progressValue(progress);

  if (motionId.startsWith('pack:')) {
    const entry = packMotionCatalog.find((candidate) => candidate.adapterId === motionId);
    if (!entry) throw new Error(`Unknown motion: ${motionId}`);
    return packProfileFor(entry, role, p);
  }

  if (motionId === 'text-morph') return evaluateMotionProfile('blur', role, p);
  if (motionId === 'text-scramble' || motionId === 'text-shimmer' || motionId === 'animated-shiny-text') {
    return evaluateMotionProfile('fade', role, p);
  }
  if (motionId === 'animated-number' || motionId === 'number-ticker') return evaluateMotionProfile('scale', role, p);

  if (motionId === 'fade') {
    return { opacity: visibleOpacity(role, p), translateX: 0, translateY: 0, scale: 1, rotationDeg: 0 };
  }

  if (motionId === 'fade_in' || motionId === 'fade_out') return evaluateMotionProfile('fade', role, p);
  if (motionId === 'fade_blur') return evaluateMotionProfile('blur', role, p);

  const directionalDistance = 520;
  if (motionId === 'slide_left' || motionId === 'slide_right' || motionId === 'slide_top' || motionId === 'slide_bottom') {
    const horizontal = motionId === 'slide_left' || motionId === 'slide_right';
    const direction = motionId === 'slide_left' || motionId === 'slide_top' ? -1 : 1;
    return {
      opacity: visibleOpacity(role, p),
      translateX: horizontal ? lerp(direction * directionalDistance, 0, p) : 0,
      translateY: horizontal ? 0 : lerp(direction * directionalDistance, 0, p),
      scale: 1,
      rotationDeg: 0,
    };
  }
  if (motionId === 'slide_out_left' || motionId === 'slide_out_right' || motionId === 'slide_out_bottom') {
    const horizontal = motionId !== 'slide_out_bottom';
    const direction = motionId === 'slide_out_left' ? -1 : 1;
    return {
      opacity: visibleOpacity(role, p),
      translateX: horizontal ? lerp(0, direction * directionalDistance, p) : 0,
      translateY: horizontal ? 0 : lerp(0, directionalDistance, p),
      scale: 1,
      rotationDeg: 0,
    };
  }
  if (motionId === 'scale_grow' || motionId === 'scale_punch') return evaluateMotionProfile('scale', role, p);
  if (motionId === 'scale_out') return evaluateMotionProfile('scale', role, p);
  if (motionId === 'word_reveal' || motionId === 'typewriter') return evaluateMotionProfile('fade', role, p);
  if (motionId === 'slam') return evaluateMotionProfile('scale', role, p);
  if (motionId === 'wipe_left' || motionId === 'wipe_right' || motionId === 'wipe_out') return evaluateMotionProfile('fade', role, p);

  if (motionId === 'slide') {
    return {
      opacity: visibleOpacity(role, p),
      translateX: 0,
      translateY: role === 'enter' ? lerp(24, 0, p) : lerp(0, 24, p),
      scale: 1,
      rotationDeg: 0,
    };
  }

  if (motionId === 'scale') {
    return {
      opacity: visibleOpacity(role, p),
      translateX: 0,
      translateY: 0,
      scale: role === 'enter' ? lerp(0.8, 1, p) : lerp(1, 0.8, p),
      rotationDeg: 0,
    };
  }

  if (motionId === 'blur') {
    return {
      opacity: visibleOpacity(role, p),
      translateX: 0,
      translateY: 0,
      scale: 1,
      rotationDeg: 0,
      blurPx: role === 'enter' ? lerp(8, 0, p) : lerp(0, 8, p),
    };
  }

  if (motionId === 'blur-slide') {
    return {
      opacity: visibleOpacity(role, p),
      translateX: 0,
      translateY: role === 'enter' ? lerp(24, 0, p) : lerp(0, 24, p),
      scale: 1,
      rotationDeg: 0,
      blurPx: role === 'enter' ? lerp(8, 0, p) : lerp(0, 8, p),
    };
  }

  if (motionId === 'zoom') {
    return {
      opacity: visibleOpacity(role, p),
      translateX: 0,
      translateY: 0,
      scale: role === 'enter' ? lerp(0.5, 1, p) : lerp(1, 0.85, p),
      rotationDeg: 0,
    };
  }

  if (motionId === 'flip') {
    return {
      opacity: visibleOpacity(role, p),
      translateX: 0,
      translateY: 0,
      scale: 1,
      rotationDeg: role === 'enter' ? lerp(-90, 0, p) : lerp(0, 90, p),
    };
  }

  if (motionId === 'bounce') {
    return {
      opacity: visibleOpacity(role, p),
      translateX: 0,
      translateY: role === 'enter' ? lerp(-50, 0, p) : lerp(0, 50, p),
      scale: 1,
      rotationDeg: 0,
    };
  }

  if (motionId === 'rotate') {
    return {
      opacity: visibleOpacity(role, p),
      translateX: 0,
      translateY: 0,
      scale: 1,
      rotationDeg: role === 'enter' ? lerp(-180, 0, p) : lerp(0, 180, p),
    };
  }

  if (motionId === 'swing') {
    return {
      opacity: visibleOpacity(role, p),
      translateX: 0,
      translateY: 0,
      scale: 1,
      rotationDeg: role === 'enter' ? lerp(-10, 0, p) : lerp(0, 10, p),
    };
  }

  if (motionId === 'scale-in') {
    return {
      opacity: visibleOpacity(role, p),
      translateX: 0,
      translateY: 0,
      scale: role === 'enter' ? lerp(0.82, 1, p) : lerp(1, 0.82, p),
      rotationDeg: 0,
    };
  }

  if (motionId === 'soft-slide') {
    return {
      opacity: visibleOpacity(role, p),
      translateX: role === 'enter' ? lerp(-24, 0, p) : lerp(0, 24, p),
      translateY: 0,
      scale: 1,
      rotationDeg: 0,
    };
  }

  if (motionId === 'spin-360' || motionId === 'spin-720' || motionId === 'spin-out') {
    const turns = motionId === 'spin-720' ? 720 : 360;
    const direction = motionId === 'spin-out' ? -1 : 1;
    return {
      opacity: visibleOpacity(role, p),
      translateX: 0,
      translateY: 0,
      scale: 1,
      rotationDeg: role === 'enter' ? lerp(0, turns * direction, p) : lerp(0, turns * direction, p),
    };
  }

  if (motionId === 'shrink') {
    return {
      opacity: visibleOpacity(role, p),
      translateX: 0,
      translateY: 0,
      scale: role === 'exit' ? lerp(1, 0.72, p) : lerp(0.72, 1, p),
      rotationDeg: 0,
    };
  }

  if (motionId === 'text-roll') {
    return {
      opacity: visibleOpacity(role, p),
      translateX: 0,
      translateY: 0,
      scale: 1,
      rotationDeg: role === 'enter' ? lerp(90, 0, p) : lerp(0, 90, p),
    };
  }

  if (motionId === 'animated-list') {
    return {
      opacity: visibleOpacity(role, p),
      translateX: 0,
      translateY: 0,
      scale: role === 'enter' ? lerp(0, 1, p) : lerp(1, 0, p),
      rotationDeg: 0,
    };
  }

  if (motionId === 'animated-group') {
    return { opacity: visibleOpacity(role, p), translateX: 0, translateY: 0, scale: 1, rotationDeg: 0 };
  }

  return undefined;
}

export function evaluateMotion(
  motionId: string,
  role: MotionRole,
  progress: number,
  props?: PartialMotionParameterSet,
): MotionFrame {
  const p = progressValue(progress);

  if (motionId === 'spring-in' && role === 'enter') {
    return applyCommon({
      opacity: p === 0 ? 0 : 1,
      translateX: 0,
      translateY: p === 0 ? 24 : 0,
      scale: p === 0 ? 0.75 : 1,
      rotationDeg: 0,
    }, props);
  }

  if (motionId === 'scale-fade-out' && role === 'exit') {
    return applyCommon({
      opacity: 1 - p,
      translateX: 0,
      translateY: 0,
      scale: lerp(1, 0.72, p),
      rotationDeg: 0,
    }, props);
  }

  if (motionId === 'fly-right' && role === 'enter') {
    return applyCommon({ opacity: p === 0 ? 0 : 1, translateX: p === 0 ? 520 : 0, translateY: 0, scale: 1, rotationDeg: 0 }, props);
  }

  if (motionId === 'fly-left' && role === 'exit') {
    return applyCommon({ opacity: p >= 1 ? 0 : 1, translateX: p >= 1 ? -520 : 0, translateY: 0, scale: 1, rotationDeg: 0 }, props);
  }

  if (motionId === 'pop' && role === 'enter') {
    return applyCommon({ opacity: p === 0 ? 0 : 1, translateX: 0, translateY: 0, scale: p === 0 ? 0.2 : 1, rotationDeg: 0 }, props);
  }

  const profile = evaluateMotionProfile(motionId, role, p);
  if (profile) return applyCommon(profile, props);

  throw new Error(`Unknown motion: ${motionId}`);
}

export function evaluateMotionAtFrame(input: MotionFrameInput): MotionFrame {
  const params: MotionParameterSet = normalizeMotionParams(input.props);
  const safeFps = Number.isFinite(input.fps) && input.fps > 0 ? input.fps : 30;
  const safeFrame = Number.isFinite(input.frame) ? Math.max(0, input.frame) : 0;
  const progress = (safeFrame / safeFps - params.common.start) / params.common.duration;
  return evaluateMotion(input.motionId, input.role, progress, params);
}

export const evaluateMotionFrame = evaluateMotionAtFrame;
