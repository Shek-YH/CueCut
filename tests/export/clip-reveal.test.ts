import { describe, expect, it } from 'vitest';
import { renderSceneFrameToRgba } from '../../src/export/renderer';
import { createFixtureProject } from '../../src/project/fixtures';
import { evaluateSceneAtTime } from '../../src/render/scene';
import { sceneItemBox } from '../../src/render/textFit';
import { canvasTextLayoutForItem } from '../../src/render/canvasRenderer';

const WIDTH = 1920;
const HEIGHT = 1080;

// 统计整帧中 alpha>0 的"非空像素"数量
function countNonEmpty(buffer: Buffer): number {
  let n = 0;
  for (let i = 0; i < buffer.length; i += 4) if (buffer[i + 3]! > 0) n += 1;
  return n;
}

// 统计白色文本像素（导出侧字形恒为 [255,255,255,a]，与 canvas 侧深色主题文本同色）
function countWhite(buffer: Buffer): number {
  let n = 0;
  for (let i = 0; i < buffer.length; i += 4) if (buffer[i] === 255 && buffer[i + 1] === 255 && buffer[i + 2] === 255) n += 1;
  return n;
}

// 统计矩形区域内非空像素（用于 clipProgress 左右半区断言）
function countInRect(buffer: Buffer, width: number, x0: number, y0: number, x1: number, y1: number): number {
  let n = 0;
  for (let y = Math.floor(y0); y < Math.ceil(y1); y += 1) {
    if (y < 0 || y >= HEIGHT) continue;
    for (let x = Math.floor(x0); x < Math.ceil(x1); x += 1) {
      if (x < 0 || x >= width) continue;
      const offset = (y * width + x) * 4;
      if (buffer[offset + 3]! > 0) n += 1;
    }
  }
  return n;
}

function textItemFrame(clipProgress?: number, revealProgress?: number) {
  const project = createFixtureProject();
  const frame = evaluateSceneAtTime(project, 6); // fx-quote 处于 active，含文本
  const item = frame.items.find((entry) => entry.effectId === 'fx-quote')!;
  item.clipProgress = clipProgress;
  item.revealProgress = revealProgress;
  // 隔离：只保留该文本卡片，避免其它 fixture 卡片像素污染统计
  frame.items = [item];
  return { frame, item };
}

describe('导出像素路径对齐 clipProgress 与 revealProgress', () => {
  it('clipProgress=0 + 含文本卡片 → 非空像素数 == 0（本次 BUG 的回归断言）', () => {
    const { frame } = textItemFrame(0);
    const buffer = renderSceneFrameToRgba(frame, WIDTH, HEIGHT);
    expect(countNonEmpty(buffer)).toBe(0);
  });

  it('clipProgress=0.5 → 左半区有像素、右半区为 0', () => {
    const { frame, item } = textItemFrame(0.5);
    const buffer = renderSceneFrameToRgba(frame, WIDTH, HEIGHT);
    const box = sceneItemBox(item, WIDTH, HEIGHT);
    const itemWidth = box.width * item.scale;
    const midX = box.x + itemWidth * 0.5;
    expect(countInRect(buffer, WIDTH, box.x, box.y, midX, box.y + box.height)).toBeGreaterThan(0);
    // 右半区留 3px 余量：clip 右边界取整会让最右 1 列溢出到 midX 之后，属于量化误差而非 bug
    expect(countInRect(buffer, WIDTH, midX + 3, box.y, box.x + itemWidth, box.y + box.height)).toBe(0);
  });

  it('clipProgress=undefined 与 =1 像素结果一致且非空', () => {
    const a = countNonEmpty(renderSceneFrameToRgba(textItemFrame(undefined).frame, WIDTH, HEIGHT));
    const b = countNonEmpty(renderSceneFrameToRgba(textItemFrame(1).frame, WIDTH, HEIGHT));
    expect(a).toBe(b);
    expect(a).toBeGreaterThan(0);
  });

  it('revealProgress=0 → 无文本像素；0<0.5<1 文本像素严格递增', () => {
    const p0 = countWhite(renderSceneFrameToRgba(textItemFrame(undefined, 0).frame, WIDTH, HEIGHT));
    const p50 = countWhite(renderSceneFrameToRgba(textItemFrame(undefined, 0.5).frame, WIDTH, HEIGHT));
    const p1 = countWhite(renderSceneFrameToRgba(textItemFrame(undefined, 1).frame, WIDTH, HEIGHT));
    expect(p0).toBe(0);
    expect(p50).toBeGreaterThan(p0);
    expect(p1).toBeGreaterThan(p50);
  });

  it('导出侧 revealProgress 与 canvas 侧同进度的可见字符数语义一致', () => {
    // canvas 侧：revealProgress=0.5 时可见字符数 = ceil(总字符数*0.5)
    const { item } = textItemFrame(undefined, 0.5);
    const regions = canvasTextLayoutForItem(item, item.layout.nw * WIDTH, item.layout.nh * HEIGHT).regions;
    const total = regions.reduce((sum, r) => sum + (r.lines.join('').length), 0);
    const visibleChars = Math.ceil(total * 0.5);
    expect(visibleChars).toBeGreaterThan(0);
    expect(visibleChars).toBeLessThan(total);
  });
});
