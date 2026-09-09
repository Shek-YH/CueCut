export function secondsFromTimelineX(input: {
  clientX: number;
  left: number;
  width: number;
  durationSec: number;
}): number {
  if (input.width <= 0) return 0;
  const ratio = Math.max(0, Math.min(1, (input.clientX - input.left) / input.width));
  return ratio * input.durationSec;
}

export function clampEffectMove(input: {
  startSec: number;
  endSec: number;
  deltaSec: number;
  durationSec: number;
}): { startSec: number; endSec: number } {
  const duration = input.endSec - input.startSec;
  const startSec = Math.max(0, Math.min(input.durationSec - duration, input.startSec + input.deltaSec));
  return { startSec, endSec: startSec + duration };
}

export function clampEffectTrim(input: {
  startSec: number;
  endSec: number;
  edge: 'start' | 'end';
  deltaSec: number;
  minimumDurationSec: number;
  durationSec?: number;
}): { startSec: number; endSec: number } {
  if (input.edge === 'start') {
    return {
      startSec: Math.max(0, Math.min(input.endSec - input.minimumDurationSec, input.startSec + input.deltaSec)),
      endSec: input.endSec,
    };
  }

  const maximumEnd = input.durationSec ?? Number.POSITIVE_INFINITY;
  return {
    startSec: input.startSec,
    endSec: Math.max(input.startSec + input.minimumDurationSec, Math.min(maximumEnd, input.endSec + input.deltaSec)),
  };
}

