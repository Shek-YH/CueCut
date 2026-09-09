import catalog from './packCatalog.json' with { type: 'json' };

export interface PackMotionCatalogEntry {
  id: string;
  displayName: string;
  packId: string;
  packVersion: string;
  family: string;
  effectFamilyId: string;
  semanticTags: string[];
  visualTags: string[];
  motionCategory: string;
  adapterId: string;
  supportedAspectRatios: string[];
  durationRangeSec: [number, number];
  useCases: string[];
  avoidCases: string[];
  source: string;
  sourceRef: string;
  license: 'PROJECT-LOCAL';
  licenseRef: string;
}

export const packMotionCatalog = catalog as PackMotionCatalogEntry[];

export const packVersions = [...new Set(packMotionCatalog.map((entry) => entry.packVersion))].sort();

export function findPackMotion(id: string): PackMotionCatalogEntry | undefined {
  return packMotionCatalog.find((entry) => entry.id === id || entry.adapterId === id);
}
