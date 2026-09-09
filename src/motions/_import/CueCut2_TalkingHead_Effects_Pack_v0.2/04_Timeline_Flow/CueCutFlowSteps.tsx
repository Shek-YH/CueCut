import React from "react";
import { getSkinTokens } from "../00_shared/skin";
import {
  type BaseEffectProps,
  type CueCutTextItem,
  clamp01,
  easeOutCubic,
  segmentProgress,
} from "../00_shared/types";

export type CueCutFlowStepsProps = BaseEffectProps & {
  items: CueCutTextItem[];
  direction?: "horizontal" | "vertical";
};

export function CueCutFlowSteps({
  progress,
  skin = "minimal",
  accentColor,
  className,
  style,
  items,
  direction = "horizontal",
}: CueCutFlowStepsProps) {
  const tokens = getSkinTokens(skin, accentColor);
  const horizontal = direction === "horizontal";

  return (
    <div
      className={className}
      style={{
        ...tokens.panel,
        width: horizontal ? 880 : 520,
        borderRadius: 26,
        padding: 26,
        color: tokens.text,
        fontFamily: "system-ui, sans-serif",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: horizontal ? "row" : "column",
          gap: horizontal ? 12 : 18,
          alignItems: "stretch",
        }}
      >
        {items.map((item, index) => {
          const nodeP = easeOutCubic(segmentProgress(progress, index, items.length));
          const connectorP =
            index < items.length - 1
              ? clamp01(progress * items.length - (index + 0.55))
              : 0;

          return (
            <React.Fragment key={item.id}>
              <div
                style={{
                  flex: 1,
                  minWidth: horizontal ? 0 : undefined,
                  borderRadius: 18,
                  padding: 18,
                  background: "rgba(255,255,255,0.055)",
                  border: `1px solid ${nodeP > 0.78 ? tokens.accent : tokens.track}`,
                  opacity: nodeP,
                  transform: `scale(${0.95 + nodeP * 0.05})`,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    display: "grid",
                    placeItems: "center",
                    background: tokens.accent,
                    color: "#fff",
                    fontWeight: 850,
                  }}
                >
                  {index + 1}
                </div>
                <div style={{ marginTop: 12, fontSize: 16, fontWeight: 760 }}>{item.text}</div>
                {item.subtext ? (
                  <div style={{ marginTop: 4, fontSize: 13, color: tokens.muted }}>{item.subtext}</div>
                ) : null}
              </div>
              {index < items.length - 1 ? (
                <div
                  style={{
                    alignSelf: "center",
                    width: horizontal ? 46 : 3,
                    height: horizontal ? 3 : 32,
                    background: `linear-gradient(${horizontal ? "90deg" : "180deg"}, ${tokens.accent} ${connectorP * 100}%, ${tokens.track} ${connectorP * 100}%)`,
                    borderRadius: 999,
                    flex: "0 0 auto",
                  }}
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
