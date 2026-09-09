import React from "react";
import { CueCutSocialAction } from "./CueCutSocialAction";
import { type BaseEffectProps, clamp01 } from "../00_shared/types";

export type CueCutEngagementStackProps = BaseEffectProps & {
  include?: Array<"like" | "follow" | "subscribe">;
};

export function CueCutEngagementStack({
  progress,
  skin,
  accentColor,
  className,
  style,
  include = ["like", "follow", "subscribe"],
}: CueCutEngagementStackProps) {
  return (
    <div className={className} style={{ display: "flex", gap: 10, alignItems: "center", ...style }}>
      {include.map((action, i) => {
        const start = i * 0.18;
        const local = clamp01((progress - start) / (1 - start));
        return (
          <CueCutSocialAction
            key={action}
            action={action}
            progress={local}
            skin={skin}
            accentColor={accentColor}
          />
        );
      })}
    </div>
  );
}
