import { normalizeMotionParams, type MotionParameterSet, type PartialMotionParameterSet, type MotionRole } from './format';
import { packMotionCatalog } from './packCatalog';

export interface MotionFrame {
  opacity: number;
  translateX: number;
  translateY: number;
  scale: number;
  rotationDeg: number;
  blurPx?: number;
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

function packProfileId(motionId: string): 'fade' | 'slide' | 'scale' | 'blur' {
  let hash = 0;
  for (const character of motionId) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return (['fade', 'slide', 'scale', 'blur'] as const)[hash % 4] ?? 'fade';
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
    if (!packMotionCatalog.some((entry) => entry.adapterId === motionId)) throw new Error(`Unknown motion: ${motionId}`);
    return evaluateMotionProfile(packProfileId(motionId), role, p);
  }

  if (motionId === 'text-morph') return evaluateMotionProfile('blur', role, p);
  if (motionId === 'text-scramble' || motionId === 'text-shimmer' || motionId === 'animated-shiny-text') {
    return evaluateMotionProfile('fade', role, p);
  }
  if (motionId === 'animated-number' || motionId === 'number-ticker') return evaluateMotionProfile('scale', role, p);

  if (motionId === 'fade') {
    return { opacity: visibleOpacity(role, p), translateX: 0, translateY: 0, scale: 1, rotationDeg: 0 };
  }

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
