import { z } from 'zod';
import { cameraMotions, emphasisMotions, entranceMotions, exitMotions } from '../packaging-ir/schema';

const motionIntentSchema = z.object({
  entrance: z.enum(entranceMotions),
  emphasis: z.enum(emphasisMotions),
  exit: z.enum(exitMotions),
  camera: z.enum(cameraMotions).optional(),
}).strict();

export type PackagingMotionIntent = z.infer<typeof motionIntentSchema>;

export interface CompiledMotionPhase {
  motionId: string;
  durationSec: number;
  ease: string;
  keyframes: Array<Record<string, number>>;
}

export interface CompiledMotion {
  seed: number;
  enter: CompiledMotionPhase;
  emphasis: CompiledMotionPhase;
  exit: CompiledMotionPhase;
  camera?: string;
}

const phase = (motionId: string, durationSec: number, ease: string, keyframes: Array<Record<string, number>>): CompiledMotionPhase => ({ motionId, durationSec, ease, keyframes });

function entrance(motionId: PackagingMotionIntent['entrance'], durationSec: number): CompiledMotionPhase {
  if (motionId === 'scale_punch') return phase(motionId, durationSec, 'back.out', [{ scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1 }]);
  if (motionId === 'fade_blur') return phase(motionId, durationSec, 'power2.out', [{ opacity: 0, blur: 12 }, { opacity: 1, blur: 0 }]);
  if (motionId === 'slide_left') return phase(motionId, durationSec, 'power2.out', [{ x: -0.15, opacity: 0 }, { x: 0, opacity: 1 }]);
  if (motionId === 'slide_right') return phase(motionId, durationSec, 'power2.out', [{ x: 0.15, opacity: 0 }, { x: 0, opacity: 1 }]);
  if (motionId === 'slide_top') return phase(motionId, durationSec, 'power2.out', [{ y: -0.15, opacity: 0 }, { y: 0, opacity: 1 }]);
  if (motionId === 'slide_bottom') return phase(motionId, durationSec, 'power2.out', [{ y: 0.15, opacity: 0 }, { y: 0, opacity: 1 }]);
  if (motionId === 'wipe_left' || motionId === 'wipe_right') return phase(motionId, durationSec, 'power2.out', [{ clipProgress: 0, opacity: 1 }, { clipProgress: 1, opacity: 1 }]);
  if (motionId === 'scale_grow') return phase(motionId, durationSec, 'power2.out', [{ scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1 }]);
  if (motionId === 'word_reveal' || motionId === 'typewriter') return phase(motionId, durationSec, 'linear', [{ revealProgress: 0, opacity: 1 }, { revealProgress: 1, opacity: 1 }]);
  if (motionId === 'slam') return phase(motionId, durationSec, 'expo.out', [{ scale: 1.4, opacity: 0 }, { scale: 1, opacity: 1 }]);
  return phase(motionId, durationSec, 'linear', [{ opacity: 0 }, { opacity: 1 }]);
}

function emphasis(motionId: PackagingMotionIntent['emphasis'], durationSec: number): CompiledMotionPhase {
  if (motionId === 'scale_pulse') return phase(motionId, durationSec, 'sine.inOut', [{ scale: 1 }, { scale: 1.08 }, { scale: 1 }]);
  if (motionId === 'shake') return phase(motionId, durationSec, 'sine.inOut', [{ x: 0 }, { x: -0.015 }, { x: 0.015 }, { x: 0 }]);
  if (motionId === 'glow') return phase(motionId, durationSec, 'sine.inOut', [{ glow: 0 }, { glow: 1 }, { glow: 0 }]);
  if (motionId === 'color_shift') return phase(motionId, durationSec, 'sine.inOut', [{ colorProgress: 0 }, { colorProgress: 1 }]);
  if (motionId === 'underline_sweep' || motionId === 'highlight_sweep' || motionId === 'scribble') return phase(motionId, durationSec, 'power2.out', [{ progress: 0 }, { progress: 1 }]);
  if (motionId === 'counter' || motionId === 'bar_fill') return phase(motionId, durationSec, 'power2.out', [{ progress: 0 }, { progress: 1 }]);
  return phase(motionId, durationSec, 'linear', [{ progress: 1 }]);
}

function exit(motionId: PackagingMotionIntent['exit'], durationSec: number): CompiledMotionPhase {
  if (motionId === 'scale_out') return phase(motionId, durationSec, 'power2.in', [{ scale: 1, opacity: 1 }, { scale: 0.9, opacity: 0 }]);
  if (motionId === 'slide_out_left') return phase(motionId, durationSec, 'power2.in', [{ x: 0, opacity: 1 }, { x: -0.15, opacity: 0 }]);
  if (motionId === 'slide_out_right') return phase(motionId, durationSec, 'power2.in', [{ x: 0, opacity: 1 }, { x: 0.15, opacity: 0 }]);
  if (motionId === 'slide_out_bottom') return phase(motionId, durationSec, 'power2.in', [{ y: 0, opacity: 1 }, { y: 0.15, opacity: 0 }]);
  if (motionId === 'wipe_out') return phase(motionId, durationSec, 'power2.in', [{ clipProgress: 1, opacity: 1 }, { clipProgress: 0, opacity: 0 }]);
  return phase(motionId, durationSec, 'linear', [{ opacity: 1 }, { opacity: 0 }]);
}

export function compileMotionIntent(value: unknown, options: { seed: number; durationSec: number }): CompiledMotion {
  const intent = motionIntentSchema.parse(value);
  const durationSec = Math.max(0.01, options.durationSec);
  const phaseDuration = Math.max(0.01, Math.min(0.8, durationSec / 3));
  return {
    seed: Math.trunc(options.seed),
    enter: entrance(intent.entrance, phaseDuration),
    emphasis: emphasis(intent.emphasis, phaseDuration),
    exit: exit(intent.exit, phaseDuration),
    ...(intent.camera ? { camera: intent.camera } : {}),
  };
}
