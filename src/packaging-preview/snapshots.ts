export interface SnapshotOverlayTiming { id: string; startSec: number; endSec: number; importance: number }
export interface PackagingSnapshotPlan { times: number[]; overlaySamples: Array<{ overlayId: string; timeSec: number }> }

const round = (value: number): number => Math.round(value * 1000) / 1000;

export function createPackagingSnapshotPlan(input: { durationSec: number; overlays: SnapshotOverlayTiming[] }): PackagingSnapshotPlan {
  const times = new Set<number>([0, input.durationSec]);
  if (input.durationSec > 180) for (const fraction of [0.25, 0.5, 0.75]) times.add(round(input.durationSec * fraction));
  const signature = input.overlays.slice().sort((left, right) => left.startSec - right.startSec)[0];
  if (signature) times.add(round(signature.startSec + (signature.endSec - signature.startSec) * 0.1));
  const peak = input.overlays.slice().sort((left, right) => right.importance - left.importance)[0];
  if (peak) times.add(round((peak.startSec + peak.endSec) / 2));
  const overlaySamples = input.overlays.flatMap((overlay) => {
    const duration = overlay.endSec - overlay.startSec;
    return [0.1, 0.5, 0.9].map((fraction) => ({ overlayId: overlay.id, timeSec: round(overlay.startSec + duration * fraction) }));
  });
  overlaySamples.forEach((sample) => times.add(sample.timeSec));
  return { times: [...times].sort((left, right) => left - right), overlaySamples };
}
