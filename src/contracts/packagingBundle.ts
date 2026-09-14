import { z } from 'zod';
import { packagingPlanSchema } from '../packaging-ir/schema';
import { projectCompositionSchema } from '../project/schema';

const safeFileNameSchema = z.string().min(1).max(255).refine((value) => value !== '.' && value !== '..' && !/[\\/]/.test(value) && !/^[A-Za-z]:/.test(value) && !/^\\\\/.test(value) && !/^https?:\/\//i.test(value), 'asset fileName must be a local file name');

export const externalAssetEntrySchema = z.object({
  assetId: z.string().regex(/^[a-z][a-z0-9_]*$/),
  fileName: safeFileNameSchema,
  kind: z.enum(['generated', 'imported', 'builtin']),
  mimeType: z.enum(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']).optional(),
  required: z.boolean(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/i).optional(),
  sourceSubtitleIds: z.array(z.string().min(1)).optional(),
  projectAssetRef: z.string().min(1).optional(),
}).strict();

export const externalProjectMetadataSchema = z.object({
  projectId: z.string().min(1),
  durationSec: z.number().finite().positive(),
  fps: z.number().finite().positive(),
  canvasWidth: z.number().int().positive(),
  canvasHeight: z.number().int().positive(),
  aspectRatio: z.string().min(1),
  sourceFileName: safeFileNameSchema.optional(),
}).strict();

const transcriptSegmentSchema = z.object({ id: z.string().min(1), startSec: z.number().finite().min(0), endSec: z.number().finite().positive(), text: z.string() }).strict().superRefine((value, context) => {
  if (value.endSec <= value.startSec) context.addIssue({ code: 'custom', path: ['endSec'], message: 'transcript endSec must be greater than startSec' });
});

const bundleBaseSchema = z.object({
  schema: z.literal('cuecut.packaging-bundle'),
  version: z.literal(1),
  bundleId: z.string().min(1).optional(),
  createdAt: z.string().datetime().optional(),
  generator: z.object({ name: z.string().min(1), version: z.string().min(1).optional() }).strict().optional(),
  project: externalProjectMetadataSchema.optional(),
  assets: z.array(externalAssetEntrySchema).max(4096),
  transcript: z.array(transcriptSegmentSchema).max(10000).optional(),
  warnings: z.array(z.string().max(1000)).max(256).optional(),
}).strict();

export const cueCutPackagingBundleSchema = z.discriminatedUnion('mode', [
  bundleBaseSchema.extend({ mode: z.literal('plan'), packagingPlan: packagingPlanSchema, composition: z.never().optional() }),
  bundleBaseSchema.extend({ mode: z.literal('project'), composition: projectCompositionSchema, packagingPlan: z.never().optional() }),
]);

export type CueCutPackagingBundle = z.infer<typeof cueCutPackagingBundleSchema>;
export type ExternalAssetEntry = z.infer<typeof externalAssetEntrySchema>;
