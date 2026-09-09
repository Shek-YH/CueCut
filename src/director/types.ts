export interface TranscriptInput {
  id: string;
  startSec: number;
  endSec: number;
  text: string;
}

export interface VisualContext {
  subjectZones: Array<{ nx: number; ny: number; nw: number; nh: number }>;
  faceZones: Array<{ nx: number; ny: number; nw: number; nh: number }>;
  subtitleReservedZone: { nx: number; ny: number; nw: number; nh: number } | null;
  safeMargins: number;
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

