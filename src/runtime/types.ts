import type { CompiledMotion } from '../packaging-motion/compiler';

export type { CompiledMotion };

export interface CanonicalRuntimeItem {
  runtimeId: string;
  sourceEffectId: string;
  segmentId: string;
  template: {
    effectTemplateId: string;
    rendererId: string;
    familyId: string;
    variantId: string;
  };
  content: Record<string, unknown>;
  asset?: {
    assetId: string;
    source: 'generated' | 'imported' | 'builtin';
    projectAssetRef: string;
    trimmedRef?: string;
  };
  layout: {
    nx: number;
    ny: number;
    nw: number;
    nh: number;
    anchor: string;
    zone?: string;
    zIndex: number;
  };
  time: {
    startSec: number;
    endSec: number;
  };
  motion: CompiledMotion;
  appearance: {
    accent: string;
    theme: 'dark' | 'light';
    opacity: number;
  };
  sfx?: {
    sfxId: string;
    offsetSec: number;
    gain: number;
  };
  provenance: {
    sourceSubtitleIds: string[];
    keyClaim?: string;
    evidenceText?: string;
    selectionReason?: string;
  };
}
