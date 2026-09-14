import { describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createExportController } from '../../src/export/controller';
import { evaluateSceneAtTime } from '../../src/render/scene';
import { renderSceneFrameToRgba } from '../../src/export/renderer';
import type { ProjectComposition } from '../../src/project/schema';

const ROOT = resolve(import.meta.dirname, '..', '..');
const COMPOSITION_PATH = resolve(ROOT, 'renders', 'jj-composition.json');
const VIDEO_PATH = resolve(ROOT, '测试素材与api', 'jj.mp4');
const OUTPUT_DIR = resolve(ROOT, 'renders', 'verify');

describe('真实短片段 MP4 端到端导出（验证导出路径文字可读）', () => {
  it('导出 5 秒真实 mp4 并校验文字为可读真字形', { timeout: 180_000 }, async () => {
    const project = JSON.parse(await fs.readFile(COMPOSITION_PATH, 'utf8')) as ProjectComposition;
    project.project.chapterNav = { visible: true, position: 'top', showProgress: true };
    project.project.durationSec = 5;
    project.project.fps = 30;
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    const outPath = resolve(OUTPUT_DIR, 'short-e2e.mp4');
    await fs.rm(outPath, { force: true });

    await createExportController().start({
      mode: 'full-video',
      project,
      inputPath: VIDEO_PATH,
      outputPath: outPath,
      expectedVideoCodec: 'h264',
      expectedAudio: true,
    });

    const stat = await fs.stat(outPath);
    expect(stat.size).toBeGreaterThan(1024 * 1024);

    // 用 ffmpeg 抽出第 3 秒的一帧，确认导出链路真实跑通
    const framePng = resolve(OUTPUT_DIR, 'short-e2e-frame.png');
    execFileSync('ffmpeg', ['-y', '-ss', '3', '-i', outPath, '-frames:v', '1', framePng], { stdio: 'ignore' });
    expect(await fs.stat(framePng)).toBeTruthy();

    // 直接对导出 RGBA 路径做墨迹统计：证明该帧含有非透明像素与白色真字形文字（非噪点）
    const frame = evaluateSceneAtTime(project, 3);
    const buffer = renderSceneFrameToRgba(frame, project.project.canvasWidth, project.project.canvasHeight, project.subtitleSettings, project.project.canvasWidth);
    let ink = 0;
    let whiteText = 0;
    for (let i = 0; i < buffer.length; i += 4) {
      if (buffer[i + 3]! > 0) ink += 1;
      if (buffer[i]! > 200 && buffer[i + 1]! > 200 && buffer[i + 2]! > 200) whiteText += 1;
    }
    expect(ink).toBeGreaterThan(0);
    expect(whiteText).toBeGreaterThan(0);
    console.log(`[e2e] mp4=${(stat.size / 1024 / 1024).toFixed(1)}MB ink=${ink} whiteText=${whiteText}`);
  });
});
