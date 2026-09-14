import { describe, expect, it } from 'vitest';
import { renderSceneFrameToRgba } from '../../src/export/renderer';
import { createFixtureProject } from '../../src/project/fixtures';
import { evaluateSceneAtTime } from '../../src/render/scene';
import type { ProjectComposition, SubtitleSettings } from '../../src/project/schema';

const WIDTH = 800;
const HEIGHT = 800;

interface GlyphStats {
  ink: number;
  bboxW: number;
  bboxH: number;
  aspect: number;
  centerDensity: number;
  overallDensity: number;
}

// 通过真实导出路径（renderSceneFrameToRgba）把单个汉字渲染成 RGBA buffer，
// 仅统计白色墨迹（r/g/b 均 > 200，过滤掉黑色描边与黑色阴影），并做与字体无关的几何分析。
function glyphStatsForChar(char: string): GlyphStats {
  const project: ProjectComposition = createFixtureProject();
  project.project.durationSec = 30;
  project.project.canvasWidth = WIDTH;
  project.project.canvasHeight = HEIGHT;
  project.project.fps = 30;
  project.effects = [];
  project.subtitles = [{ id: 's-1', startSec: 0, endSec: 30, text: char }];
  const settings: SubtitleSettings = {
    visible: true,
    fontSize: 360,
    color: '#FFFFFF',
    strokeColor: '#000000',
    strokeWidth: 0,
    lineHeight: 1.2,
    letterSpacing: 0,
    position: 'center',
  };
  project.subtitleSettings = settings;
  const buffer = renderSceneFrameToRgba(evaluateSceneAtTime(project, 1), WIDTH, HEIGHT, settings, WIDTH);

  let minX = WIDTH;
  let minY = HEIGHT;
  let maxX = 0;
  let maxY = 0;
  let ink = 0;
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const offset = (y * WIDTH + x) * 4;
      if (buffer[offset]! > 200 && buffer[offset + 1]! > 200 && buffer[offset + 2]! > 200) {
        ink += 1;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const bboxW = Math.max(1, maxX - minX);
  const bboxH = Math.max(1, maxY - minY);

  // 中心 40%×40% 区域密度（用于验证「口」这类中空字形）
  const cx0 = minX + Math.floor(bboxW * 0.3);
  const cx1 = minX + Math.floor(bboxW * 0.7);
  const cy0 = minY + Math.floor(bboxH * 0.3);
  const cy1 = minY + Math.floor(bboxH * 0.7);
  let centerInk = 0;
  let centerTotal = 0;
  for (let y = cy0; y < cy1; y += 1) {
    for (let x = cx0; x < cx1; x += 1) {
      centerTotal += 1;
      const offset = (y * WIDTH + x) * 4;
      if (buffer[offset]! > 200 && buffer[offset + 1]! > 200 && buffer[offset + 2]! > 200) centerInk += 1;
    }
  }

  return {
    ink,
    bboxW,
    bboxH,
    aspect: bboxW / bboxH,
    centerDensity: centerInk / Math.max(1, centerTotal),
    overallDensity: ink / (bboxW * bboxH),
  };
}

describe('导出路径渲染真实中文字形（非噪点）', () => {
  it('「一」是横向长条：包围盒宽高比远大于 1，且确有墨迹', () => {
    const s = glyphStatsForChar('一');
    expect(s.ink).toBeGreaterThan(0);
    // 真实「一」是细横笔，宽 >> 高；旧点阵噪点每个字都是 5×7 方块（宽高比≈0.7）
    expect(s.aspect).toBeGreaterThan(3);
  });

  it('「口」中心镂空：中心区域密度明显低于整体密度', () => {
    const s = glyphStatsForChar('口');
    expect(s.ink).toBeGreaterThan(0);
    expect(s.overallDensity).toBeLessThan(0.8); // 不是实心块
    expect(s.centerDensity).toBeLessThan(s.overallDensity * 0.5);
  });

  it('不同汉字渲染出不同位图', () => {
    const a = glyphStatsForChar('一');
    const b = glyphStatsForChar('口');
    expect(a.ink).not.toBe(b.ink); // 墨迹量不同
    expect(a.aspect).toBeGreaterThan(b.aspect * 2); // 形状（宽高比）明显不同
  });

  it('墨迹覆盖率落在合理稀疏区间，而非铺满整帧的噪点', () => {
    for (const char of ['一', '口', '中', '测']) {
      const s = glyphStatsForChar(char);
      const frameInkRatio = s.ink / (WIDTH * HEIGHT);
      expect(frameInkRatio).toBeGreaterThan(0);
      expect(frameInkRatio).toBeLessThan(0.5); // 单字不应铺满近半帧（排除满格噪点）
    }
  });
});
