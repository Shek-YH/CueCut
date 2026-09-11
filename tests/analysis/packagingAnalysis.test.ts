import { describe, expect, it } from 'vitest';
import { createPackagingAnalysis } from '../../src/analysis/packagingAnalysis';

describe('packaging analysis contract', () => {
  it('normalizes deterministic inputs into the complete analysis snapshot', () => {
    const snapshot = createPackagingAnalysis({
      videoMeta: { width: 1080, height: 1920, fps: 30, durationSec: 60 },
      transcript: [{ id: 'line-1', startSec: 0, endSec: 2, text: '核心数据是 67%' }],
      scenes: [{ id: 'scene-1', startSec: 0, endSec: 60 }],
      subjects: [{ id: 'subject-1', rect: { nx: 0.2, ny: 0.1, nw: 0.4, nh: 0.7 } }],
      faces: [{ id: 'face-1', rect: { nx: 0.3, ny: 0.15, nw: 0.2, nh: 0.2 } }],
      safeZones: [{ id: 'safe-1', rect: { nx: 0.05, ny: 0.05, nw: 0.9, nh: 0.9 } }],
      edgeInsets: { top: 0.04, bottom: 0.08, left: 0.05, right: 0.05 },
      audioEnvelope: [{ timeSec: 0, value: 0.4 }],
      beats: [{ timeSec: 1.2, strength: 0.8 }],
      sceneDensity: [{ sceneId: 'scene-1', score: 0.5 }],
    });

    expect(snapshot.videoMeta.durationSec).toBe(60);
    expect(snapshot.transcript[0]?.text).toContain('67%');
    expect(snapshot.subjects).toHaveLength(1);
    expect(snapshot.faces).toHaveLength(1);
    expect(snapshot.safeZones).toHaveLength(1);
    expect(snapshot.edgeInsets).toEqual({ top: 0.04, bottom: 0.08, left: 0.05, right: 0.05 });
    expect(snapshot.audioEnvelope).toHaveLength(1);
    expect(snapshot.beats).toHaveLength(1);
    expect(snapshot.sceneDensity).toHaveLength(1);
  });
});
