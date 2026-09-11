import { z } from 'zod';
import { packagingCategories, persistenceModes, placementZones, semanticRoles, subjectRelations } from '../packaging-ir/schema';

export const packagingEffectManifestSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  category: z.enum(packagingCategories),
  title: z.string().min(1),
  tags: z.array(z.string().min(1)),
  semanticRoles: z.array(z.enum(semanticRoles)).max(16).optional(),
  visualIntents: z.array(z.string().min(1).max(120)).max(24).optional(),
  itemCountRange: z.tuple([z.number().int().positive(), z.number().int().positive()]).optional(),
  persistenceModes: z.array(z.enum(persistenceModes)).min(1).optional(),
  supportsCueTimes: z.boolean().optional(),
  supportedAspectRatios: z.array(z.string().min(1)).min(1),
  supportedZones: z.array(z.enum(placementZones)).min(1),
  subjectRelations: z.array(z.enum(subjectRelations)).min(1),
  duration: z.object({ min: z.number().finite().nonnegative(), recommended: z.number().finite().positive(), max: z.number().finite().positive() }).strict().superRefine((value, context) => {
    if (value.min > value.recommended || value.recommended > value.max) context.addIssue({ code: 'custom', path: ['duration'], message: 'duration bounds must be min <= recommended <= max' });
  }),
  motionCapabilities: z.object({ entrance: z.array(z.string().min(1)), emphasis: z.array(z.string().min(1)), exit: z.array(z.string().min(1)) }).strict(),
  contentSchema: z.record(z.string(), z.string()),
  safeZoneAware: z.boolean(),
  subtitleAware: z.boolean(),
  subjectAware: z.boolean(),
  runtime: z.enum(['canvas', 'svg', 'css', 'gsap']),
  license: z.enum(['MIT', 'PROJECT-LOCAL', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'CC-BY-4.0']),
  licenseRef: z.string().min(1),
}).strict();

export type PackagingEffectManifest = z.infer<typeof packagingEffectManifestSchema>;

export function validatePackagingEffectManifest(value: unknown): PackagingEffectManifest {
  return packagingEffectManifestSchema.parse(value);
}
