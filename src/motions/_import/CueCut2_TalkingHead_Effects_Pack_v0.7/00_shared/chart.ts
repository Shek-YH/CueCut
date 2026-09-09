import type { XYDatum } from "./types";

export function extent(values: number[]) {
  if (!values.length) return { min: 0, max: 1 };
  let min = values[0];
  let max = values[0];
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (min === max) max = min + 1;
  return { min, max };
}

export function pointsForData(
  data: XYDatum[],
  width: number,
  height: number,
  padX = 16,
  padY = 16
) {
  const { min, max } = extent(data.map((d) => d.y));
  const usableW = Math.max(1, width - padX * 2);
  const usableH = Math.max(1, height - padY * 2);

  return data.map((d, i) => ({
    x:
      data.length <= 1
        ? width / 2
        : padX + (i / (data.length - 1)) * usableW,
    y:
      padY + (1 - (d.y - min) / Math.max(0.0001, max - min)) * usableH,
    datum: d,
  }));
}

export function polylinePath(
  pts: Array<{ x: number; y: number }>
) {
  if (!pts.length) return "";
  return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
}

export function areaPath(
  pts: Array<{ x: number; y: number }>,
  baseline: number
) {
  if (!pts.length) return "";
  const line = polylinePath(pts);
  return `${line} L ${pts[pts.length - 1].x} ${baseline} L ${pts[0].x} ${baseline} Z`;
}

export function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = (angleDeg - 90) * Math.PI / 180;
  return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
}

export function donutArcPath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startDeg: number,
  endDeg: number
) {
  const startOuter = polar(cx, cy, rOuter, endDeg);
  const endOuter = polar(cx, cy, rOuter, startDeg);
  const startInner = polar(cx, cy, rInner, startDeg);
  const endInner = polar(cx, cy, rInner, endDeg);
  const large = endDeg - startDeg <= 180 ? 0 : 1;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${rOuter} ${rOuter} 0 ${large} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${rInner} ${rInner} 0 ${large} 1 ${endInner.x} ${endInner.y}`,
    "Z",
  ].join(" ");
}
