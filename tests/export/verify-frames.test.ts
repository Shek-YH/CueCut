import { describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import { resolve } from 'node:path';
import { createCanvas } from '@napi-rs/canvas';
import { createFixtureProject } from '../../src/project/fixtures';
import { evaluateSceneAtTime, type SceneFrame } from '../../src/render/scene';
import { renderSceneFrameToRgba, renderProjectFrame } from '../../src/export/renderer';
import { createCanvasRenderer } from '../../src/render/canvasRenderer';
import type { ProjectComposition } from '../../src/project/schema';

const PROJECT_ROOT = resolve(import.meta.dirname, '..', '..');
const COMPOSITION_PATH = resolve(PROJECT_ROOT, 'renders', 'jj-composition.json');
const OUTPUT_DIR = resolve(PROJECT_ROOT, 'renders', 'verify');

function hexToRgb(hex: string): [number, number, number] {
  return [Number.parseInt(hex.slice(1, 3), 16), Number.parseInt(hex.slice(3, 5), 16), Number.parseInt(hex.slice(5, 7), 16)];
}

// 把导出 RGBA buffer 合成到项目背景色上，便于与编辑器路径 PNG 直观对比（实际导出是透明叠加层，合成后观感一致）
function exportBufferToPng(buffer: Buffer, width: number, height: number, bgHex: string): Promise<Buffer> {
  const [br, bg, bb] = hexToRgb(bgHex);
  const out = Buffer.alloc(width * height * 4);
  for (let i = 0; i < buffer.length; i += 4) {
    const a = buffer[i + 3]! / 255;
    out[i] = Math.round(buffer[i]! * a + br * (1 - a));
    out[i + 1] = Math.round(buffer[i + 1]! * a + bg * (1 - a));
    out[i + 2] = Math.round(buffer[i + 2]! * a + bb * (1 - a));
    out[i + 3] = 255;
  }
  const cv = createCanvas(width, height);
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(width, height);
  img.data.set(out);
  ctx.putImageData(img, 0, 0);
  return cv.encode('png') as unknown as Promise<Buffer>;
}

function editorFrameToPng(project: ProjectComposition, timeSec: number, width: number, height: number): Promise<Buffer> {
  const cv = createCanvas(width, height);
  const ctx = cv.getContext('2d') as unknown as CanvasRenderingContext2D;
  const renderer = createCanvasRenderer(project);
  renderer.renderFrame(timeSec, ctx);
  return cv.encode('png') as unknown as Promise<Buffer>;
}

function countInk(buffer: Buffer): number {
  let n = 0;
  for (let i = 0; i < buffer.length; i += 4) if (buffer[i + 3]! > 0) n += 1;
  return n;
}

describe('导出文字可读性验证 PNG（编辑器路径 vs 导出 RGBA 路径）', () => {
  it('复用真实包装 plan 渲染多帧，导出两套可比对的 PNG', { timeout: 120_000 }, async () => {
    const raw = JSON.parse(await fs.readFile(COMPOSITION_PATH, 'utf8')) as ProjectComposition;
    const project: ProjectComposition = { ...raw };
    // 启用章节导航，确保能产出导航条文字帧
    project.project.chapterNav = { visible: true, position: 'top', showProgress: true };
    const width = project.project.canvasWidth;
    const height = project.project.canvasHeight;
    const bgHex = project.project.palette.background;

    const chapters = project.chapters ?? [];
    const navTime = chapters.length > 0 ? chapters[0]!.startSec + 1 : 3;
    const timepoints: Array<{ t: number; tag: string }> = [
      { t: 3, tag: 'card-subtitle' },
      { t: 30, tag: 'card' },
      { t: 150, tag: 'card2' },
      { t: navTime, tag: 'nav' },
    ];

    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    for (const { t, tag } of timepoints) {
      const frame: SceneFrame = evaluateSceneAtTime(project, t);
      const exportBuffer = renderSceneFrameToRgba(frame, width, height, project.subtitleSettings ?? undefined, width);
      const exportInk = countInk(exportBuffer);
      // 导出帧必须含有非透明像素（证明有卡片/文字/导航被渲染）
      expect(exportInk).toBeGreaterThan(0);

      const exportPng = await exportBufferToPng(exportBuffer, width, height, bgHex);
      const editorPng = await editorFrameToPng(project, t, width, height);
      const exportPath = resolve(OUTPUT_DIR, `t${t}-${tag}-export.png`);
      const editorPath = resolve(OUTPUT_DIR, `t${t}-${tag}-editor.png`);
      await fs.writeFile(exportPath, exportPng);
      await fs.writeFile(editorPath, editorPng);
      console.log(`[verify] t=${t} (${tag}) exportInk=${exportInk} exportPng=${(exportPng.length / 1024).toFixed(0)}KB editorPng=${(editorPng.length / 1024).toFixed(0)}KB`);
      expect(exportPng.length).toBeGreaterThan(1024);
      expect(editorPng.length).toBeGreaterThan(1024);
    }
  });
});
