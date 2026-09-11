import { execFile } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';
import { createFixtureProject } from '../../src/project/fixtures';
import { createExportController } from '../../src/export/controller';
import { renderProjectFrame, renderSceneFrameToRgba } from '../../src/export/renderer';
import { probeVideoFile } from '../../src/media/videoProbe';
import { evaluateSceneAtTime } from '../../src/render/scene';

const execFileAsync = promisify(execFile);
const fixturePath = 'test-results/cuecut-portable-fixture.mp4';

async function ensureFixture() {
  await mkdir('test-results', { recursive: true });
  await execFileAsync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', 'scripts/create-test-video.ps1', '-OutputPath', fixturePath]);
}

function exportProject() {
  const project = createFixtureProject();
  project.project.durationSec = 2;
  project.project.canvasWidth = 320;
  project.project.canvasHeight = 180;
  project.project.aspectRatio = '16:9';
  project.subtitles = [{ id: 's-1', startSec: 0.2, endSec: 1.4, text: 'Portable export 中文' }];
  project.effects = project.effects.map((effect, index) => ({
    ...effect,
    familyId: `pack-0-2-${index === 0 ? 'percentage' : index === 1 ? 'checklist' : 'versus'}`,
    variantId: `pack:${index === 0 ? 'cuecut-ring-metric' : index === 1 ? 'cuecut-checklist' : 'cuecut-versus-card'}`,
    time: { startSec: 0.2 + index * 0.2, endSec: 1.5 + index * 0.1 },
    motion: {
      enter: { motionId: `pack:${index === 0 ? 'cuecut-ring-metric' : index === 1 ? 'cuecut-checklist' : 'cuecut-versus-card'}`, durationSec: 0.3, intensity: 0.5 },
      exit: { motionId: 'fade', durationSec: 0.2, intensity: 0.4 },
    },
  }));
  return project;
}

describe('portable actual export', () => {
  describe('portable subtitle frames', () => {
    it('omits hidden subtitles from portable export frames', () => {
      const project = createFixtureProject();
      project.effects = [];
      project.subtitles = [{ id: 's-1', startSec: 0, endSec: 2, text: 'Export subtitle' }];
      project.subtitleSettings = { visible: true, fontSize: 42, color: '#FFFFFF', strokeColor: '#000000', strokeWidth: 2, lineHeight: 1.2, letterSpacing: 0, position: 'bottom' };

      const visibleFrame = renderProjectFrame(project, 1);
      project.subtitleSettings.visible = false;
      const hiddenFrame = renderProjectFrame(project, 1);

      expect(visibleFrame.some((value) => value !== 0)).toBe(true);
      expect(hiddenFrame.every((value) => value === 0)).toBe(true);
    });

    it('scales subtitle glyphs from the actual project canvas width', () => {
      const project = createFixtureProject();
      project.project.canvasWidth = 320;
      project.project.canvasHeight = 180;
      project.project.aspectRatio = '16:9';
      project.effects = [];
      project.subtitles = [{ id: 's-1', startSec: 0, endSec: 2, text: 'A subtitle long enough to wrap' }];
      project.subtitleSettings = { visible: true, fontSize: 42, color: '#FFFFFF', strokeColor: '#000000', strokeWidth: 2, lineHeight: 1.2, letterSpacing: 0, position: 'bottom' };

      const frame = evaluateSceneAtTime(project, 1);
      const projectSizedFrame = renderSceneFrameToRgba(frame, 320, 180, project.subtitleSettings, project.project.canvasWidth);
      const legacySizedFrame = renderSceneFrameToRgba(frame, 320, 180, project.subtitleSettings, 1920);
      const opaquePixels = (rgba: Buffer) => Array.from(rgba).filter((value, index) => index % 4 === 3 && value > 0).length;

      expect(opaquePixels(projectSizedFrame)).toBeGreaterThan(opaquePixels(legacySizedFrame));
    });
  });

  it('exports a real MP4, transparent ProRes MOV, and transparent WebM and validates all with ffprobe', async () => {
    await ensureFixture();
    const project = exportProject();
    const mp4Path = 'test-results/cuecut-portable-output.mp4';
    const movPath = 'test-results/cuecut-portable-overlay.mov';
    const webmPath = 'test-results/cuecut-portable-overlay.webm';
    await rm(mp4Path, { force: true });
    await rm(movPath, { force: true });
    await rm(webmPath, { force: true });

    const mp4 = await createExportController().start({ mode: 'full-video', project, inputPath: fixturePath, outputPath: mp4Path });
    const mov = await createExportController().start({ mode: 'transparent-mov', project, outputPath: movPath });
    const webm = await createExportController().start({ mode: 'transparent-webm', project, outputPath: webmPath });

    expect(mp4.metadata).toMatchObject({ width: 320, height: 180, hasAudio: true });
    expect(mov.metadata).toMatchObject({ width: 320, height: 180, hasAudio: false, pixelFormat: expect.stringMatching(/yuva|rgba|argb/i) });
    expect(webm.metadata).toMatchObject({ width: 320, height: 180, hasAudio: false, codec: 'vp9', alphaMode: '1' });
    expect(mp4.metadata.durationSec).toBeCloseTo(2, 1);
    expect(mov.metadata.durationSec).toBeCloseTo(2, 1);
    expect(webm.metadata.durationSec).toBeCloseTo(2, 1);
    expect((await probeVideoFile(mp4Path)).codec).toBe('h264');
    expect((await probeVideoFile(movPath)).codec).toContain('prores');
    expect((await probeVideoFile(webmPath)).codec).toBe('vp9');
  }, 120_000);
});
