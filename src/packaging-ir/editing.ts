import { packagingPlanSchema, type PackagingPlan } from './schema';

const canvasSizes: Record<string, [number, number]> = { '9:16': [1080, 1920], '16:9': [1920, 1080], '4:5': [1080, 1350] };

export function editPackagingPlan(plan: PackagingPlan, edit: { visualStyle?: string; aspectRatio?: string; motionIntensity?: number; subjectAvoidPadding?: number }): PackagingPlan {
  const next = structuredClone(plan);
  if (edit.visualStyle) next.globalStyle.visualStyle = edit.visualStyle;
  if (edit.motionIntensity !== undefined) next.globalStyle.motionIntensity = Math.max(0, Math.min(1, edit.motionIntensity));
  if (edit.subjectAvoidPadding !== undefined) next.constraints.subjectAvoidPadding = Math.max(0, Math.min(0.5, edit.subjectAvoidPadding));
  if (edit.aspectRatio) {
    next.canvas.aspectRatio = edit.aspectRatio;
    const size = canvasSizes[edit.aspectRatio];
    if (size) { next.canvas.width = size[0]; next.canvas.height = size[1]; }
  }
  return packagingPlanSchema.parse(next);
}

export function lockPackagingOverlay(plan: PackagingPlan, overlayId: string, zone: PackagingPlan['timeline'][number]['placementIntent']['preferredZones'][number]): PackagingPlan {
  const next = structuredClone(plan);
  const overlay = next.timeline.find((item) => item.id === overlayId);
  if (!overlay) throw new Error(`Packaging overlay not found: ${overlayId}`);
  overlay.userOverride = { locked: true, zone };
  return packagingPlanSchema.parse(next);
}
