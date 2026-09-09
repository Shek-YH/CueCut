export interface NormalizedRect {
  nx: number;
  ny: number;
  nw: number;
  nh: number;
}

export interface LayoutSolveResult {
  rect: NormalizedRect;
  manualOverride: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clampRect(rect: NormalizedRect, safeMargin: number): NormalizedRect {
  return {
    ...rect,
    nx: clamp(rect.nx, safeMargin, 1 - safeMargin - rect.nw),
    ny: clamp(rect.ny, safeMargin, 1 - safeMargin - rect.nh),
  };
}

function overlaps(left: NormalizedRect, right: NormalizedRect): boolean {
  return left.nx < right.nx + right.nw && left.nx + left.nw > right.nx && left.ny < right.ny + right.nh && left.ny + left.nh > right.ny;
}

export function solveLayout(input: {
  preferred: NormalizedRect;
  safeMargin: number;
  blocked: NormalizedRect[];
  importance: number;
  manual: boolean;
  locked: boolean;
}): LayoutSolveResult {
  if (input.locked || input.manual) {
    return { rect: input.preferred, manualOverride: true };
  }

  const preferred = clampRect(input.preferred, input.safeMargin);
  const candidates: NormalizedRect[] = [];
  for (let row = 0; row <= 20; row += 1) {
    for (let column = 0; column <= 20; column += 1) {
      candidates.push(clampRect({
        ...input.preferred,
        nx: row / 20,
        ny: column / 20,
      }, input.safeMargin));
    }
  }

  candidates.sort((left, right) => {
    const leftDistance = Math.abs(left.nx - preferred.nx) + Math.abs(left.ny - preferred.ny);
    const rightDistance = Math.abs(right.nx - preferred.nx) + Math.abs(right.ny - preferred.ny);
    return leftDistance - rightDistance;
  });

  const valid = candidates.find((candidate) => input.blocked.every((blocked) => !overlaps(candidate, blocked)));
  return { rect: valid ?? preferred, manualOverride: valid === undefined };
}

