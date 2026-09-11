export interface PackagingRect {
  nx: number;
  ny: number;
  nw: number;
  nh: number;
}

export interface PackagingVideoMeta {
  width: number;
  height: number;
  fps: number;
  durationSec: number;
}

export interface PackagingTranscriptItem {
  id: string;
  startSec: number;
  endSec: number;
  text: string;
}

export interface PackagingScene {
  id: string;
  startSec: number;
  endSec: number;
}

export interface PackagingSubject {
  id: string;
  rect: PackagingRect;
}

export interface PackagingFace {
  id: string;
  rect: PackagingRect;
}

export interface PackagingSafeZone {
  id: string;
  rect: PackagingRect;
}

export interface PackagingEdgeInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface PackagingAudioSample {
  timeSec: number;
  value: number;
}

export interface PackagingBeat {
  timeSec: number;
  strength: number;
}

export interface PackagingSceneDensity {
  sceneId: string;
  score: number;
}

export interface PackagingAnalysisInput {
  videoMeta: PackagingVideoMeta;
  transcript: PackagingTranscriptItem[];
  scenes: PackagingScene[];
  subjects: PackagingSubject[];
  faces: PackagingFace[];
  safeZones: PackagingSafeZone[];
  edgeInsets: PackagingEdgeInsets;
  audioEnvelope: PackagingAudioSample[];
  beats: PackagingBeat[];
  sceneDensity: PackagingSceneDensity[];
}

export interface PackagingAnalysisSnapshot extends PackagingAnalysisInput {
  analysisVersion: '1.0';
  generatedBy: 'deterministic-local-analysis';
}

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

function rect(rect: PackagingRect): PackagingRect {
  return {
    nx: clamp(rect.nx, 0, 1),
    ny: clamp(rect.ny, 0, 1),
    nw: clamp(rect.nw, 0, 1),
    nh: clamp(rect.nh, 0, 1),
  };
}

function sortedByTime<T extends { startSec?: number; timeSec?: number }>(items: T[]): T[] {
  return items
    .map((item) => ({ ...item }))
    .sort((left, right) => (left.startSec ?? left.timeSec ?? 0) - (right.startSec ?? right.timeSec ?? 0));
}

export function createPackagingAnalysis(input: PackagingAnalysisInput): PackagingAnalysisSnapshot {
  return {
    analysisVersion: '1.0',
    generatedBy: 'deterministic-local-analysis',
    videoMeta: {
      width: Math.max(1, Math.round(input.videoMeta.width)),
      height: Math.max(1, Math.round(input.videoMeta.height)),
      fps: Math.max(1, input.videoMeta.fps),
      durationSec: Math.max(0.001, input.videoMeta.durationSec),
    },
    transcript: sortedByTime(input.transcript),
    scenes: sortedByTime(input.scenes),
    subjects: input.subjects.map((subject) => ({ ...subject, rect: rect(subject.rect) })),
    faces: input.faces.map((face) => ({ ...face, rect: rect(face.rect) })),
    safeZones: input.safeZones.map((zone) => ({ ...zone, rect: rect(zone.rect) })),
    edgeInsets: {
      top: clamp(input.edgeInsets.top, 0, 0.5),
      bottom: clamp(input.edgeInsets.bottom, 0, 0.5),
      left: clamp(input.edgeInsets.left, 0, 0.5),
      right: clamp(input.edgeInsets.right, 0, 0.5),
    },
    audioEnvelope: sortedByTime(input.audioEnvelope).map((sample) => ({ ...sample, value: clamp(sample.value, 0, 1) })),
    beats: sortedByTime(input.beats).map((beat) => ({ ...beat, strength: clamp(beat.strength, 0, 1) })),
    sceneDensity: input.sceneDensity.map((density) => ({ ...density, score: clamp(density.score, 0, 1) })),
  };
}
