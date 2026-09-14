import { z } from 'zod';

export const visualAssetKinds = ['character', 'object', 'product-object', 'concept-metaphor', '3d-object', 'illustration', 'mini-scene', 'decorative-object'] as const;

export const visualAssetRequestSchema = z.object({
  needed: z.literal(true),
  assetId: z.string().regex(/^[a-z][a-z0-9_]*$/),
  displayName: z.string().min(1).max(160),
  kind: z.enum(visualAssetKinds),
  description: z.string().min(1).max(1000),
  semanticTags: z.array(z.string().min(1).max(64)).max(32),
  importance: z.enum(['hero', 'normal', 'small']),
}).strict();

export type VisualAssetRequest = z.infer<typeof visualAssetRequestSchema>;
