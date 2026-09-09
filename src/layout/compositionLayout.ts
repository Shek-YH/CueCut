import type { ProjectComposition } from '../project/schema';
import type { VisualContext } from '../director/types';
import { solveLayout } from './solver';
import { blockedZonesForVisualContext } from './visualContext';

export function resolveCompositionLayout(composition: ProjectComposition, context: VisualContext): ProjectComposition {
  const blocked = blockedZonesForVisualContext(context);
  return {
    ...composition,
    effects: composition.effects.map((effect) => {
      const maxWidth = Math.max(0.01, 1 - context.safeMargins * 2);
      const maxHeight = Math.max(0.01, 1 - context.safeMargins * 2);
      const solved = solveLayout({
        preferred: { ...effect.layout, nw: Math.min(effect.layout.nw, maxWidth), nh: Math.min(effect.layout.nh, maxHeight) },
        safeMargin: context.safeMargins,
        blocked,
        importance: 1,
        manual: effect.userFlags.manual,
        locked: effect.userFlags.locked,
      });
      const nw = Math.min(solved.rect.nw, maxWidth);
      const nh = Math.min(solved.rect.nh, maxHeight);
      const nx = Math.min(solved.rect.nx, 1 - context.safeMargins - nw);
      const ny = Math.min(solved.rect.ny, 1 - context.safeMargins - nh);
      return { ...effect, layout: { ...effect.layout, nx: round(nx), ny: round(ny), nw: round(nw), nh: round(nh) } };
    }),
  };
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
