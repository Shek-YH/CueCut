import type { CSSProperties } from "react";
import type { CueCutSkin } from "./types";

export type SkinTokens = {
  panel: CSSProperties;
  text: string;
  muted: string;
  accent: string;
  track: string;
  positive: string;
  negative: string;
  warning: string;
};

export function getSkinTokens(
  skin: CueCutSkin = "minimal",
  accentOverride?: string
): SkinTokens {
  const skins: Record<CueCutSkin, SkinTokens> = {
    minimal: {
      panel: {
        background: "rgba(10,12,18,0.90)",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 18px 56px rgba(0,0,0,0.24)",
      },
      text: "#f8fafc",
      muted: "#94a3b8",
      accent: "#60a5fa",
      track: "rgba(255,255,255,0.12)",
      positive: "#34d399",
      negative: "#fb7185",
      warning: "#fbbf24",
    },
    glass: {
      panel: {
        background: "rgba(15,23,42,0.58)",
        border: "1px solid rgba(255,255,255,0.18)",
        backdropFilter: "blur(16px)",
        boxShadow: "0 18px 64px rgba(0,0,0,0.28)",
      },
      text: "#ffffff",
      muted: "#cbd5e1",
      accent: "#818cf8",
      track: "rgba(255,255,255,0.15)",
      positive: "#6ee7b7",
      negative: "#fda4af",
      warning: "#fde68a",
    },
    tech: {
      panel: {
        background: "rgba(3,7,18,0.95)",
        border: "1px solid rgba(34,211,238,0.24)",
        boxShadow: "0 18px 70px rgba(8,145,178,0.15)",
      },
      text: "#ecfeff",
      muted: "#67e8f9",
      accent: "#22d3ee",
      track: "rgba(34,211,238,0.14)",
      positive: "#2dd4bf",
      negative: "#fb7185",
      warning: "#facc15",
    },
    soft: {
      panel: {
        background: "rgba(255,255,255,0.94)",
        border: "1px solid rgba(15,23,42,0.08)",
        boxShadow: "0 18px 50px rgba(15,23,42,0.10)",
      },
      text: "#0f172a",
      muted: "#64748b",
      accent: "#6366f1",
      track: "rgba(15,23,42,0.10)",
      positive: "#10b981",
      negative: "#e11d48",
      warning: "#d97706",
    },
  };

  const base = skins[skin];
  return { ...base, accent: accentOverride ?? base.accent };
}
