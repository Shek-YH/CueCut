import { packMotionCatalog, type PackMotionCatalogEntry } from '../motions/packCatalog';

export const canonicalPackagingCatalog: PackMotionCatalogEntry[] = packMotionCatalog;

export const directorCatalogView = canonicalPackagingCatalog.map((entry) => ({
  id: entry.id,
  familyId: entry.effectFamilyId,
  variantId: entry.adapterId,
  displayName: entry.displayName,
  tags: [...new Set([entry.family, ...entry.semanticTags, ...entry.visualTags])],
}));
