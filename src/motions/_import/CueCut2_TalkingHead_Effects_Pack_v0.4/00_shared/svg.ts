export const dashForProgress = (progress: number, length = 1) => {
  const p = Math.max(0, Math.min(1, progress));
  return {
    strokeDasharray: length,
    strokeDashoffset: length * (1 - p),
  };
};

export const pathPoint = (
  start: { x: number; y: number },
  end: { x: number; y: number },
  progress: number
) => ({
  x: start.x + (end.x - start.x) * progress,
  y: start.y + (end.y - start.y) * progress,
});
