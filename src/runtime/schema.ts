import { z } from 'zod';

const compiledMotionPhaseSchema = z.object({
  motionId: z.string().min(1),
  durationSec: z.number().finite().min(0),
  ease: z.string().min(1),
  keyframes: z.array(z.record(z.string(), z.number().finite())).min(1),
}).strict();

export const compiledMotionSchema = z.object({
  seed: z.number().int(),
  enter: compiledMotionPhaseSchema,
  emphasis: compiledMotionPhaseSchema,
  exit: compiledMotionPhaseSchema,
  camera: z.string().min(1).optional(),
}).strict();

export const canonicalRuntimeItemSchema = z.object({
  runtimeId: z.string().min(1),
  sourceEffectId: z.string().min(1),
  segmentId: z.string().min(1),
  template: z.object({
    effectTemplateId: z.string().min(1),
    rendererId: z.string().min(1),
    familyId: z.string().min(1),
    variantId: z.string().min(1),
  }).strict(),
  content: z.record(z.string(), z.unknown()),
  asset: z.object({
    assetId: z.string().min(1),
    source: z.enum(['generated', 'imported', 'builtin']),
    projectAssetRef: z.string().min(1),
    trimmedRef: z.string().min(1).optional(),
  }).strict().optional(),
  layout: z.object({
    nx: z.number().finite().min(0).max(1),
    ny: z.number().finite().min(0).max(1),
    nw: z.number().finite().positive().max(1),
    nh: z.number().finite().positive().max(1),
    anchor: z.string().min(1),
    zone: z.string().min(1).optional(),
    zIndex: z.number().int().min(0),
  }).strict(),
  time: z.object({
    startSec: z.number().finite().min(0),
    endSec: z.number().finite().positive(),
  }).strict().superRefine((value, context) => {
    if (value.endSec <= value.startSec) context.addIssue({ code: 'custom', path: ['endSec'], message: 'endSec must be greater than startSec' });
  }),
  motion: compiledMotionSchema,
  appearance: z.object({
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    theme: z.enum(['dark', 'light']),
    opacity: z.number().finite().min(0).max(1),
  }).strict(),
  sfx: z.object({
    sfxId: z.string().min(1),
    offsetSec: z.number().finite(),
    gain: z.number().finite().min(0).max(1),
  }).strict().optional(),
  provenance: z.object({
    sourceSubtitleIds: z.array(z.string().min(1)),
    keyClaim: z.string().min(1).optional(),
    evidenceText: z.string().min(1).optional(),
    selectionReason: z.string().min(1).optional(),
  }).strict(),
}).strict();
