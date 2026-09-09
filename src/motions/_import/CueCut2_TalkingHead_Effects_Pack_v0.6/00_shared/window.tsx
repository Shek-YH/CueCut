import React from "react";

export function TrafficLights({ scale = 1 }: { scale?: number }) {
  const size = 10 * scale;
  const gap = 6 * scale;
  return (
    <div style={{ display: "flex", gap }}>
      <span style={{ width: size, height: size, borderRadius: 999, background: "#fb7185" }} />
      <span style={{ width: size, height: size, borderRadius: 999, background: "#fbbf24" }} />
      <span style={{ width: size, height: size, borderRadius: 999, background: "#34d399" }} />
    </div>
  );
}
