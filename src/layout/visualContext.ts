import type { VisualContext } from '../director/types';
import type { NormalizedRect } from './solver';

export function createUnavailableVisualContext(input: {
  subtitleReservedZone: NormalizedRect | null;
  safeMargins: number;
  optionalSceneHints?: string[];
}): VisualContext {
  return {
    subjectZones: [],
    faceZones: [],
    subtitleReservedZone: input.subtitleReservedZone,
    safeMargins: input.safeMargins,
    noGoZones: [],
    subjectZonesStatus: 'unavailable',
    faceZonesStatus: 'unavailable',
    optionalSceneHints: input.optionalSceneHints,
  };
}

export function blockedZonesForVisualContext(context: VisualContext): NormalizedRect[] {
  return [
    ...context.subjectZones,
    ...context.faceZones,
    ...(context.subtitleReservedZone ? [context.subtitleReservedZone] : []),
    ...(context.noGoZones ?? []),
  ];
}
