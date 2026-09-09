import React from "react";
import { CueCutIcon } from "../00_shared/CueCutIcon";
import { getSkinTokens } from "../00_shared/skin";
import { type BaseEffectProps, easeOutBack, easeOutCubic } from "../00_shared/types";

export type CueCutStatusStampProps = BaseEffectProps & {
  status: "success" | "error";
  text?: string;
};

export function CueCutStatusStamp({
  progress,
  skin = "minimal",
  className,
  style,
  status,
  text,
}: CueCutStatusStampProps) {
  const tokens = getSkinTokens(skin);
  const p = easeOutCubic(progress);
  const pop = easeOutBack(progress);
  const ok = status === "success";
  const color = ok ? tokens.positive : tokens.negative;

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        border: `4px solid ${color}`,
        borderRadius: 18,
        padding: "10px 16px",
        color,
        fontFamily: "system-ui, sans-serif",
        fontSize: 21,
        fontWeight: 950,
        letterSpacing: 1.2,
        textTransform: "uppercase",
        opacity: p,
        transform: `rotate(${ok ? -3 : 3}deg) scale(${0.62 + pop * 0.38})`,
        ...style,
      }}
    >
      <CueCutIcon name={ok ? "check" : "x"} size={27} color={color} />
      {text ?? (ok ? "Success" : "Error")}
    </div>
  );
}
