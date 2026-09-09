import React from "react";

export function Sparkle({
  size = 22,
  color = "currentColor",
  opacity = 1,
}: {
  size?: number;
  color?: string;
  opacity?: number;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ opacity }}>
      <path
        d="M12 2.5c.7 4.8 2.7 7 7.5 7.5-4.8.6-6.8 2.7-7.5 7.5-.7-4.8-2.7-6.9-7.5-7.5 4.8-.5 6.8-2.7 7.5-7.5Z"
        fill={color}
      />
    </svg>
  );
}
