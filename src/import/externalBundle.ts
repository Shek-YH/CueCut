import { compileProjectToRuntime } from '../runtime/compiler';
import { applyResolvedPackagingToProject } from '../packaging/apply';
import { resolvePackagingPlan } from '../packaging/resolve';
import { projectCompositionSchema, type ProjectComposition } from '../project/schema';
import { cueCutPackagingBundleSchema, type ExternalAssetEntry } from '../contracts/packagingBundle';

export type ExternalSelectedFile = { name: string; type?: string };

export type ExternalBundleImportResult = {
  project: ProjectComposition;
  status: 'completed' | 'partial';
  boundAssetCount: number;
  missingRequiredAssetIds: string[];
  warnings: string[];
};

export function importExternalBundle(input: unknown, baseProject: ProjectComposition, selectedFiles: ExternalSelectedFile[]): ExternalBundleImportResult {
  const bundle = cueCutPackagingBundleSchema.parse(input);
  const importedProject = bundle.mode === 'plan'
    ? applyResolvedPackagingToProject(baseProject, {
      overlays: resolvePackagingPlan(bundle.packagingPlan).overlays,
      chapters: bundle.packagingPlan.chapters?.map((chapter) => ({ id: chapter.id, title: chapter.title, startSec: chapter.startSec, endSec: chapter.endSec })),
    })
    : projectCompositionSchema.parse(bundle.composition);
  const binding = bindAssets(importedProject, bundle.assets, selectedFiles);
  const project = projectCompositionSchema.parse(binding.project);
  compileProjectToRuntime(project);
  return { project, status: binding.missingRequiredAssetIds.length > 0 ? 'partial' : 'completed', boundAssetCount: binding.boundAssetCount, missingRequiredAssetIds: binding.missingRequiredAssetIds, warnings: binding.warnings };
}

function bindAssets(project: ProjectComposition, assets: ExternalAssetEntry[], selectedFiles: ExternalSelectedFile[]): { project: ProjectComposition; boundAssetCount: number; missingRequiredAssetIds: string[]; warnings: string[] } {
  const byName = new Map(selectedFiles.map((file) => [file.name, file]));
  let boundAssetCount = 0;
  const missingRequiredAssetIds: string[] = [];
  const warnings: string[] = [];
  const nextEffects = project.effects.map((effect) => {
    const asset = effect.asset;
    if (!asset) return effect;
    const entry = assets.find((candidate) => candidate.assetId === asset.assetId);
    if (!entry) return effect;
    const file = byName.get(entry.fileName);
    if (!file) {
      if (entry.required) missingRequiredAssetIds.push(entry.assetId);
      else warnings.push(`optional asset missing: ${entry.assetId}`);
      return effect;
    }
    boundAssetCount += 1;
    return { ...effect, asset: { ...asset, projectAssetRef: `external-file://${file.name}` } };
  });
  for (const entry of assets) {
    if (project.effects.some((effect) => effect.asset?.assetId === entry.assetId)) continue;
    if (entry.required && !byName.has(entry.fileName)) missingRequiredAssetIds.push(entry.assetId);
  }
  return { project: { ...project, effects: nextEffects }, boundAssetCount, missingRequiredAssetIds: [...new Set(missingRequiredAssetIds)], warnings };
}
