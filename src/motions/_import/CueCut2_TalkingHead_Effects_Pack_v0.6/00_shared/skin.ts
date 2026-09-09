import type { CSSProperties } from "react";
import type { CueCutSkin } from "./types";

export type SkinTokens = {
  panel: CSSProperties;
  text: string;
  muted: string;
  accent: string;
  positive: string;
  negative: string;
  warning: string;
  track: string;
  surface: string;
  codeBg: string;
};

export function getSkinTokens(
  skin: CueCutSkin = "minimal",
  accentOverride?: string
): SkinTokens {
  const map: Record<CueCutSkin, SkinTokens> = {
    minimal: {
      panel: {
        background: "rgba(8,10,16,.92)",
        border: "1px solid rgba(255,255,255,.10)",
        boxShadow: "0 20px 62px rgba(0,0,0,.28)",
      },
      text: "#f8fafc",
      muted: "#94a3b8",
      accent: "#60a5fa",
      positive: "#34d399",
      negative: "#fb7185",
      warning: "#fbbf24",
      track: "rgba(255,255,255,.12)",
      surface: "rgba(255,255,255,.055)",
      codeBg: "#0b1020",
    },
    glass: {
      panel: {
        background: "rgba(15,23,42,.62)",
        border: "1px solid rgba(255,255,255,.18)",
        backdropFilter: "blur(16px)",
        boxShadow: "0 20px 68px rgba(0,0,0,.32)",
      },
      text: "#ffffff",
      muted: "#cbd5e1",
      accent: "#818cf8",
      positive: "#6ee7b7",
      negative: "#fda4af",
      warning: "#fde68a",
      track: "rgba(255,255,255,.15)",
      surface: "rgba(255,255,255,.08)",
      codeBg: "rgba(2,6,23,.92)",
    },
    tech: {
      panel: {
        background: "rgba(3,7,18,.96)",
        border: "1px solid rgba(34,211,238,.24)",
        boxShadow: "0 20px 72px rgba(8,145,178,.16)",
      },
      text: "#ecfeff",
      muted: "#67e8f9",
      accent: "#22d3ee",
      positive: "#2dd4bf",
      negative: "#fb7185",
      warning: "#facc15",
      track: "rgba(34,211,238,.14)",
      surface: "rgba(34,211,238,.07)",
      codeBg: "#020617",
    },
    soft: {
      panel: {
        background: "rgba(255,255,255,.95)",
        border: "1px solid rgba(15,23,42,.08)",
        boxShadow: "0 18px 50px rgba(15,23,42,.10)",
      },
      text: "#0f172a",
      muted: "#64748b",
      accent: "#6366f1",
      positive: "#10b981",
      negative: "#e11d48",
      warning: "#d97706",
      track: "rgba(15,23,42,.10)",
      surface: "rgba(15,23,42,.05)",
      codeBg: "#f8fafc",
    },
  };

  const base = map[skin];
  return { ...base, accent: accentOverride ?? base.accent };
}
