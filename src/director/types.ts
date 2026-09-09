export interface TranscriptInput {
  id: string;
  startSec: number;
  endSec: number;
  text: string;
}

export type SemanticIntent =
  | 'hook'
  | 'chapter'
  | 'argument'
  | 'evidence'
  | 'comparison'
  | 'ordered_process'
  | 'list'
  | 'definition'
  | 'quote'
  | 'conclusion'
  | 'neutral';

export interface VisualUnitItem {
  id: string;
  text: string;
  startSec?: number;
  endSec?: number;
}

export interface VisualUnit {
  visualUnitId: string;
  sourceSubtitleIds: string[];
  startSec: number;
  endSec: number;
  semanticIntent: SemanticIntent;
  importance: number;
  structure?: {
    type: SemanticIntent | string;
    items?: VisualUnitItem[];
  };
  extractedData?: {
    numbers?: number[];
    percentages?: number[];
    labels?: string[];
    orderedItems?: string[];
  };
}

export type EffectDataContractKind = 'text' | 'numeric' | 'percentage' | 'list' | 'steps' | 'comparison' | 'quote' | 'progress' | 'ranking' | 'chart';

export interface EffectDataContract {
  kind: EffectDataContractKind;
  requiredSlots: string[];
  numericSlots: string[];
  itemSlots: string[];
  provenanceRequired: boolean;
}

export interface EffectCapabilityCandidate {
  familyId: string;
  variantId: string;
  displayName: string;
  semanticTags: string[];
  visualTags?: string[];
  contentSlots: string[];
  minDurationSec: number;
  maxDurationSec: number;
  supportedAspectRatios: string[];
  useCases?: string[];
  avoidCases?: string[];
  timingCapabilities?: string[];
  layoutCapabilities?: string[];
  dataContract: EffectDataContract;
}

export interface CandidateBundle {
  visualUnitId: string;
  candidates: EffectCapabilityCandidate[];
  retrievalReason: string[];
}

export interface SelectionTraceEntry {
  visualUnitId: string;
  semanticIntent: string;
  retrievedCandidates: string[];
  selected?: string;
  dataContractPassed: boolean;
  durationContractPassed: boolean;
}

export interface DirectorSemanticPlan {
  globalThemes: string[];
  units: VisualUnit[];
}

export interface VisualContext {
  subjectZones: Array<{ nx: number; ny: number; nw: number; nh: number }>;
  faceZones: Array<{ nx: number; ny: number; nw: number; nh: number }>;
  subtitleReservedZone: { nx: number; ny: number; nw: number; nh: number } | null;
  safeMargins: number;
  noGoZones?: Array<{ nx: number; ny: number; nw: number; nh: number }>;
  subjectZonesStatus?: 'available' | 'unavailable';
  faceZonesStatus?: 'available' | 'unavailable';
  optionalSceneHints?: string[];
}

export interface DirectorInput {
  project: {
    projectId: string;
    durationSec: number;
    fps: number;
    canvasWidth: number;
    canvasHeight: number;
    aspectRatio: string;
    platformHint?: string | null;
    contentStyleHint?: string | null;
  };
  transcript: TranscriptInput[];
  visualContext: VisualContext;
  effectCandidates: Array<{ id: string; tags: string[] }>;
  motionCandidates: Array<{ id: string; tags: string[] }>;
  sfxCandidates: Array<{ id: string; tags: string[]; isFavorite: boolean; usageScore: number }>;
  preferences: Record<string, unknown>;
}

export interface DirectorInputV2 extends DirectorInput {
  visualUnits: VisualUnit[];
  effectCapabilities: EffectCapabilityCandidate[];
  candidateBundles: CandidateBundle[];
  selectionTrace: SelectionTraceEntry[];
  semanticPlan: DirectorSemanticPlan;
}
