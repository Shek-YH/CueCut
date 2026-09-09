import { z } from 'zod';

const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'must be a six-digit hex color');

const timeRangeSchema = z
  .object({
    startSec: z.number().finite().min(0),
    endSec: z.number().finite().min(0),
  })
  .superRefine((value, context) => {
    if (value.endSec <= value.startSec) {
      context.addIssue({
        code: 'custom',
        path: ['endSec'],
        message: 'endSec must be greater than startSec',
      });
    }
  });

const layoutSchema = z.object({
  nx: z.number().finite().min(0).max(1),
  ny: z.number().finite().min(0).max(1),
  nw: z.number().finite().positive().max(1),
  nh: z.number().finite().positive().max(1),
  scale: z.number().finite().positive().max(4),
  anchor: z.string().min(1),
  preferredSide: z.string().min(1),
  relationToSubject: z.string().min(1),
});

const motionPartSchema = z.object({
  motionId: z.string().min(1),
  durationSec: z.number().finite().min(0),
  intensity: z.number().finite().min(0).max(1),
});

const effectSchema = z.object({
  effectId: z.string().min(1),
  segmentId: z.string().min(1),
  familyId: z.string().min(1),
  variantId: z.string().min(1),
  time: timeRangeSchema,
  content: z.record(z.string(), z.unknown()),
  layout: layoutSchema,
  appearance: z.object({
    accent: hexColorSchema,
    theme: z.enum(['dark', 'light']),
  }),
  motion: z.object({
    enter: motionPartSchema,
    exit: motionPartSchema,
  }),
  sfx: z
    .object({
      sfxId: z.string().min(1),
      offsetSec: z.number().finite(),
      gain: z.number().finite().min(0).max(1),
    })
    .nullable(),
  zIndex: z.number().int().min(1).default(1),
  userFlags: z.object({
    locked: z.boolean(),
    manual: z.boolean(),
  }).default({ locked: false, manual: false }),
  variantStateCache: z.record(z.string(), z.record(z.string(), z.unknown())).default({}),
});

export const projectCompositionSchema = z.object({
  schema: z.literal('cuecut.composition/1'),
  project: z.object({
    projectId: z.string().min(1),
    durationSec: z.number().finite().positive(),
    fps: z.number().finite().positive(),
    canvasWidth: z.number().int().positive(),
    canvasHeight: z.number().int().positive(),
    aspectRatio: z.string().min(1),
    palette: z.object({
      background: hexColorSchema,
      primary: hexColorSchema,
      accent: hexColorSchema,
      text: hexColorSchema,
    }),
    video: z.object({
      sourceFileName: z.string().nullable(),
      zIndex: z.literal(0),
      locked: z.literal(true),
    }).default({ sourceFileName: null, zIndex: 0, locked: true }),
    platformHint: z.string().nullable(),
    contentStyleHint: z.string().nullable(),
  }),
  segments: z.array(
    z.object({
      segmentId: z.string().min(1),
      sourceSubtitleIds: z.array(z.string().min(1)),
      startSec: z.number().finite().min(0),
      endSec: z.number().finite().positive(),
      intent: z.string().min(1),
      importance: z.number().finite().min(0).max(1),
    }),
  ),
  effects: z.array(effectSchema),
  soundEvents: z.array(
    z.object({
      eventId: z.string().min(1),
      sfxId: z.string().min(1),
      timeSec: z.number().finite().min(0),
      gain: z.number().finite().min(0).max(1),
    }),
  ),
  directorMeta: z.object({
    densityTargetPerMin: z.number().finite().min(0),
    maxConcurrentFx: z.number().int().positive(),
    notes: z.array(z.string()),
  }),
}).superRefine((value, context) => {
  value.effects.forEach((effect, index) => {
    if (effect.time.endSec > value.project.durationSec) {
      context.addIssue({
        code: 'custom',
        path: ['effects', index, 'time', 'endSec'],
        message: 'effect endSec must not exceed project duration',
      });
    }
  });
  value.segments.forEach((segment, index) => {
    if (segment.endSec > value.project.durationSec) {
      context.addIssue({
        code: 'custom',
        path: ['segments', index, 'endSec'],
        message: 'segment endSec must not exceed project duration',
      });
    }
  });
});

export type ProjectComposition = z.infer<typeof projectCompositionSchema>;
export type EffectInstance = ProjectComposition['effects'][number];
