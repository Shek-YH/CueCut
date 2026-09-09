import type { CSSProperties } from "react";
import type { CueCutSkin } from "./types";

export type CueCutSkinTokens = {
  panel: CSSProperties;
  text: string;
  muted: string;
  track: string;
  accent: string;
  positive: string;
  negative: string;
};

export function getSkinTokens(
  skin: CueCutSkin = "minimal",
  accentOverride?: string
): CueCutSkinTokens {
  const common: Record<CueCutSkin, CueCutSkinTokens> = {
    minimal: {
      panel: {
        background: "rgba(10, 12, 18, 0.88)",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 18px 50px rgba(0,0,0,0.22)",
      },
      text: "#f8fafc",
      muted: "#94a3b8",
      track: "rgba(255,255,255,0.12)",
      accent: "#60a5fa",
      positive: "#34d399",
      negative: "#fb7185",
    },
    glass: {
      panel: {
        background: "rgba(15, 23, 42, 0.56)",
        border: "1px solid rgba(255,255,255,0.16)",
        backdropFilter: "blur(16px)",
        boxShadow: "0 18px 60px rgba(0,0,0,0.28)",
      },
      text: "#ffffff",
      muted: "#cbd5e1",
      track: "rgba(255,255,255,0.14)",
      accent: "#818cf8",
      positive: "#6ee7b7",
      negative: "#fda4af",
    },
    tech: {
      panel: {
        background: "rgba(3, 7, 18, 0.94)",
        border: "1px solid rgba(34,211,238,0.22)",
        boxShadow: "0 18px 70px rgba(8,145,178,0.14)",
      },
      text: "#ecfeff",
      muted: "#67e8f9",
      track: "rgba(34,211,238,0.14)",
      accent: "#22d3ee",
      positive: "#2dd4bf",
      negative: "#fb7185",
    },
    soft: {
      panel: {
        background: "rgba(255,255,255,0.92)",
        border: "1px solid rgba(15,23,42,0.08)",
        boxShadow: "0 18px 50px rgba(15,23,42,0.10)",
      },
      text: "#0f172a",
      muted: "#64748b",
      track: "rgba(15,23,42,0.10)",
      accent: "#6366f1",
      positive: "#10b981",
      negative: "#e11d48",
    },
  };

  const base = common[skin];
  return {
    ...base,
    accent: accentOverride ?? base.accent,
  };
}
