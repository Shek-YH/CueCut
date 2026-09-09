import React from "react";
import { type BaseEffectProps, clamp01, smoothstep } from "../00_shared/types";

export type CueCutFocusZoomProps = BaseEffectProps & {
  children: React.ReactNode;
  fromScale?: number;
  toScale?: number;
  originX?: number; // 0..1
  originY?: number; // 0..1
  panX?: number;
  panY?: number;
};

export function CueCutFocusZoom({
  progress,
  className,
  style,
  children,
  fromScale = 1,
  toScale = 1.16,
  originX = 0.5,
  originY = 0.5,
  panX = 0,
  panY = 0,
}: CueCutFocusZoomProps) {
  const p = smoothstep(clamp01(progress));
  const scale = fromScale + (toScale - fromScale) * p;

  return (
    <div
      className={className}
      style={{
        overflow: "hidden",
        position: "relative",
        ...style,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          transformOrigin: `${originX * 100}% ${originY * 100}%`,
          transform: `translate(${panX * p}px, ${panY * p}px) scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
