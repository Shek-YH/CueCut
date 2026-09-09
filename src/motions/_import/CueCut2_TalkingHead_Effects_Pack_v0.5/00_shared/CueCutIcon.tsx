import React from "react";
import type { IconName } from "./types";

export function CueCutIcon({
  name,
  size = 28,
  strokeWidth = 2.4,
  color = "currentColor",
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const common = {
    fill: "none",
    stroke: color,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const paths: Record<IconName, React.ReactNode> = {
    check: <path {...common} d="M5 12.5 9.5 17 19 7.5" />,
    x: <><path {...common} d="M7 7 17 17" /><path {...common} d="M17 7 7 17" /></>,
    heart: <path {...common} d="M12 20s-7-4.2-7-9.2C5 7.5 7.2 5.5 10 5.5c1.1 0 2.1.4 3 1.3 0.9-.9 1.9-1.3 3-1.3 2.8 0 5 2 5 5.3C21 15.8 12 20 12 20Z" />,
    bell: <><path {...common} d="M6.5 16h11l-1.5-2.2V10a4 4 0 0 0-8 0v3.8L6.5 16Z" /><path {...common} d="M10 18.3a2.2 2.2 0 0 0 4 0" /></>,
    download: <><path {...common} d="M12 4v10" /><path {...common} d="m8 10 4 4 4-4" /><path {...common} d="M5 19h14" /></>,
    upload: <><path {...common} d="M12 20V10" /><path {...common} d="m8 14 4-4 4 4" /><path {...common} d="M5 5h14" /></>,
    copy: <><rect {...common} x="8" y="8" width="10" height="10" rx="2" /><path {...common} d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" /></>,
    link: <><path {...common} d="M9.5 14.5 14.5 9.5" /><path {...common} d="M7.8 16.2 6 18a3 3 0 0 1-4.2-4.2l3-3A3 3 0 0 1 9 10" /><path {...common} d="m16.2 7.8 1.8-1.8a3 3 0 0 1 4.2 4.2l-3 3A3 3 0 0 1 15 14" /></>,
    mouse: <><rect {...common} x="7" y="3" width="10" height="18" rx="5" /><path {...common} d="M12 3v6" /></>,
    cursor: <path {...common} d="m5 3 13 8-6 1.5L9 18 5 3Z" />,
    spark: <><path {...common} d="M12 2.8c.7 4.4 2.7 6.4 7 7-4.3.6-6.3 2.6-7 7-.7-4.4-2.7-6.4-7-7 4.3-.6 6.3-2.6 7-7Z" /><path {...common} d="M19 16.5c.25 1.7 1 2.45 2.7 2.7-1.7.25-2.45 1-2.7 2.7-.25-1.7-1-2.45-2.7-2.7 1.7-.25 2.45-1 2.7-2.7Z" /></>,
    plus: <><path {...common} d="M12 5v14" /><path {...common} d="M5 12h14" /></>,
    arrow: <><path {...common} d="M5 12h13" /><path {...common} d="m14 8 4 4-4 4" /></>,
    command: <path {...common} d="M9 7V5a2 2 0 1 0-2 2h10a2 2 0 1 0-2-2v14a2 2 0 1 0 2-2H7a2 2 0 1 0 2 2V7Z" />,
    keyboard: <><rect {...common} x="3" y="6" width="18" height="12" rx="2" /><path {...common} d="M6 10h.01M9 10h.01M12 10h.01M15 10h.01M18 10h.01M7 14h10" /></>,
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}
