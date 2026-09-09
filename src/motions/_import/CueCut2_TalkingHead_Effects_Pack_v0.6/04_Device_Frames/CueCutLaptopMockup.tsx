import React from "react";
import { type BaseEffectProps, easeOutCubic } from "../00_shared/types";

export type CueCutLaptopMockupProps = BaseEffectProps & {
  children?: React.ReactNode;
  width?: number;
};

export function CueCutLaptopMockup({
  progress,
  className,
  style,
  children,
  width = 820,
}: CueCutLaptopMockupProps) {
  const p = easeOutCubic(progress);
  const screenH = width * 0.58;

  return (
    <div
      className={className}
      style={{
        width,
        opacity: p,
        transform: `perspective(1200px) rotateX(${(1 - p) * 8}deg) translateY(${(1 - p) * 18}px)`,
        ...style,
      }}
    >
      <div
        style={{
          height: screenH,
          borderRadius: "22px 22px 12px 12px",
          padding: 12,
          background: "#111827",
          border: "2px solid rgba(255,255,255,.16)",
          boxShadow: "0 26px 70px rgba(0,0,0,.32)",
        }}
      >
        <div style={{ width: "100%", height: "100%", borderRadius: 12, overflow: "hidden", background: "#020617" }}>
          {children}
        </div>
      </div>
      <div
        style={{
          width: "110%",
          height: 22,
          marginLeft: "-5%",
          borderRadius: "0 0 40px 40px",
          background: "linear-gradient(#cbd5e1,#94a3b8)",
          boxShadow: "0 8px 18px rgba(0,0,0,.18)",
        }}
      />
    </div>
  );
}
