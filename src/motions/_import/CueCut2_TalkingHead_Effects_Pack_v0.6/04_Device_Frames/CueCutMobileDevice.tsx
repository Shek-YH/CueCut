import React from "react";
import { type BaseEffectProps, easeOutCubic } from "../00_shared/types";

export type CueCutMobileDeviceProps = BaseEffectProps & {
  children?: React.ReactNode;
  width?: number;
  height?: number;
  bezel?: number;
};

export function CueCutMobileDevice({
  progress,
  className,
  style,
  children,
  width = 300,
  height = 620,
  bezel = 12,
}: CueCutMobileDeviceProps) {
  const p = easeOutCubic(progress);

  return (
    <div
      className={className}
      style={{
        width,
        height,
        padding: bezel,
        borderRadius: 42,
        background: "#111827",
        border: "2px solid rgba(255,255,255,.18)",
        boxShadow: "0 28px 70px rgba(0,0,0,.32)",
        opacity: p,
        transform: `rotate(${(1 - p) * -3}deg) translateY(${(1 - p) * 18}px)`,
        ...style,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 32,
          overflow: "hidden",
          background: "#020617",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 8,
            left: "50%",
            transform: "translateX(-50%)",
            width: 72,
            height: 18,
            borderRadius: 999,
            background: "#05070d",
            zIndex: 2,
          }}
        />
        {children}
      </div>
    </div>
  );
}
