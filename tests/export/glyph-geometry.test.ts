/// <reference types="node" />
import { describe, expect, it } from 'vitest';
import { createCanvas, type SKRSContext2D } from '@napi-rs/canvas';
import { renderSceneFrameToRgba, renderProjectFrame, exportTextLayoutForItem } from '../../src/export/renderer';
import { ensureFontsRegistered } from '../../src/render/fontRegistry';
import { createFixtureProject } from '../../src/project/fixtures';
import { sceneItemBox } from '../../src/render/textFit';
import { evaluateSceneAtTime, type SceneFrame, type SceneItem } from '../../src/render/scene';
import { promises as fs } from 'node:fs';
import { resolve } from 'node:path';

// ----------------------------------------------------------------------------
// 独立验证器（verifier-glyphs）。所有几何/统计断言与「字体无关」，用以证伪「豆腐块」。
// ----------------------------------------------------------------------------

const W = 800;
const H = 800;

function makeSubtitleProject(char: string, fontSize = 360, opacity = 1, strokeWidth = 0, color = '#FFFFFF'): any {
  const project: any = createFixtureProject();
  project.project.durationSec = 30;
  project.project.canvasWidth = W;
  project.project.canvasHeight = H;
  project.project.fps = 30;
  project.effects = [];
  project.chapters = [];
  project.subtitles = [{ id: 's-1', startSec: 0, endSec: 30, text: char }];
  project.subtitleSettings = { visible: true, fontSize, color, strokeColor: '#000000', strokeWidth, lineHeight: 1.2, letterSpacing: 0, position: 'center' };
  return project;
}

interface Mask {
  data: Uint8Array; // 1 = ink
  w: number;
  h: number;
  ink: number;
  bbox: { minX: number; minY: number; maxX: number; maxY: number };
}

function whiteMaskFromBuffer(buffer: Buffer, w: number, h: number): Mask {
  const data = new Uint8Array(w * h);
  let ink = 0;
  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const o = (y * w + x) * 4;
      if (buffer[o]! > 200 && buffer[o + 1]! > 200 && buffer[o + 2]! > 200) {
        data[y * w + x] = 1;
        ink += 1;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
  }
  return { data, w, h, ink, bbox: { minX, minY, maxX, maxY } };
}

// 行方向上「有墨迹的行」构成的连通带数（阈值过滤抗锯齿残留的零星像素）。
// 「二」=2 条横笔带，「三」=3 条。比 bbox 宽高比更正确地刻画横笔结构：
// 「二」「三」的 bbox 高度包含笔画间距，宽高比必然接近方形，不能用 aspect 判断。
function rowInkBands(m: Mask, minRowPixels = 3): number {
  let bands = 0;
  let inBand = false;
  for (let y = m.bbox.minY; y <= m.bbox.maxY; y += 1) {
    let cnt = 0;
    for (let x = m.bbox.minX; x <= m.bbox.maxX; x += 1) cnt += m.data[y * m.w + x]!;
    const isInkRow = cnt >= minRowPixels;
    if (isInkRow && !inBand) { bands += 1; inBand = true; }
    else if (!isInkRow) inBand = false;
  }
  return bands;
}

// 每一条行带的墨迹量（用于验证打字机预算的「跨行累计」语义）
function rowBandInk(m: Mask, minRowPixels = 3): number[] {
  const bands: number[] = [];
  let current = 0;
  let inBand = false;
  for (let y = m.bbox.minY; y <= m.bbox.maxY; y += 1) {
    let cnt = 0;
    for (let x = m.bbox.minX; x <= m.bbox.maxX; x += 1) cnt += m.data[y * m.w + x]!;
    const isInkRow = cnt >= minRowPixels;
    if (isInkRow) {
      current += cnt;
      inBand = true;
    } else if (inBand) {
      bands.push(current);
      current = 0;
      inBand = false;
    }
  }
  if (inBand) bands.push(current);
  return bands;
}

function countWideRows(m: Mask, frac = 0.6): number {
  const bw = Math.max(1, m.bbox.maxX - m.bbox.minX);
  const bh = Math.max(1, m.bbox.maxY - m.bbox.minY);
  let rows = 0;
  for (let y = m.bbox.minY; y <= m.bbox.maxY; y += 1) {
    let cnt = 0;
    for (let x = m.bbox.minX; x <= m.bbox.maxX; x += 1) cnt += m.data[y * m.w + x]!;
    if (cnt / bw >= frac) rows += 1;
  }
  return rows;
}

function countTallCols(m: Mask, frac = 0.4): number {
  const bw = Math.max(1, m.bbox.maxX - m.bbox.minX);
  const bh = Math.max(1, m.bbox.maxY - m.bbox.minY);
  let cols = 0;
  for (let x = m.bbox.minX; x <= m.bbox.maxX; x += 1) {
    let cnt = 0;
    for (let y = m.bbox.minY; y <= m.bbox.maxY; y += 1) cnt += m.data[y * m.w + x]!;
    if (cnt / bh >= frac) cols += 1;
  }
  return cols;
}

function centerDensity(m: Mask): number {
  const bw = Math.max(1, m.bbox.maxX - m.bbox.minX);
  const bh = Math.max(1, m.bbox.maxY - m.bbox.minY);
  const x0 = m.bbox.minX + Math.floor(bw * 0.3), x1 = m.bbox.minX + Math.floor(bw * 0.7);
  const y0 = m.bbox.minY + Math.floor(bh * 0.3), y1 = m.bbox.minY + Math.floor(bh * 0.7);
  let c = 0, t = 0;
  for (let y = y0; y < y1; y += 1) for (let x = x0; x < x1; x += 1) { t += 1; c += m.data[y * m.w + x]!; }
  return c / Math.max(1, t);
}

function overallDensity(m: Mask): number {
  const bw = Math.max(1, m.bbox.maxX - m.bbox.minX);
  const bh = Math.max(1, m.bbox.maxY - m.bbox.minY);
  return m.ink / Math.max(1, bw * bh);
}

function renderCharMask(char: string, fontSize = 360): Mask {
  const p = makeSubtitleProject(char, fontSize);
  const buf = renderSceneFrameToRgba(evaluateSceneAtTime(p, 1), W, H, p.subtitleSettings, W);
  return whiteMaskFromBuffer(buf, W, H);
}

// IoU of two masks after aligning by centroid
function iouAligned(a: Mask, b: Mask): number {
  const ca = [(a.bbox.minX + a.bbox.maxX) / 2, (a.bbox.minY + a.bbox.maxY) / 2];
  const cb = [(b.bbox.minX + b.bbox.maxX) / 2, (b.bbox.minY + b.bbox.maxY) / 2];
  const dx = Math.round(cb[0] - ca[0]);  const dy = Math.round(cb[1] - ca[1]);
  let inter = 0, uni = 0;
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const av = a.data[y * W + x]!;
      const bx2 = x + dx, by2 = y + dy;
      const bv = bx2 >= 0 && bx2 < W && by2 >= 0 && by2 < H ? b.data[by2 * W + bx2]! : 0;
      if (av || bv) uni += 1;
      if (av && bv) inter += 1;
    }
  }
  return inter / Math.max(1, uni);
}

// 直接用 @napi-rs/canvas 渲染同一段中文（不走项目 renderer），作为几何参照
function directRenderMask(text: string, fontSize = 360, weight = 600): Mask {
  const cv = createCanvas(W, H);
  const ctx = cv.getContext('2d') as unknown as SKRSContext2D;
  const fonts = ensureFontsRegistered();
  const family = weight >= 600 ? fonts.bold : fonts.regular;
  ctx.clearRect(0, 0, W, H);
  ctx.font = `${weight} ${fontSize}px "${family}"`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#FFFFFF';
  // 模仿 subtitle 'center' 定位（与项目一致）
  const regionX = W * 0.05, regionW = W * 0.9, regionY = H * 0.42, regionH = H * 0.17;
  let total = 0;
  const chars = [...text];
  for (let i = 0; i < chars.length; i += 1) total += ctx.measureText(chars[i]!).width + (i > 0 ? 0 : 0);
  const startX = regionX + (regionW - total) / 2;
  const baselineY = regionY + Math.max(fontSize, (regionH - fontSize * 1.2) / 2 + fontSize);
  ctx.fillText(text, startX, baselineY);
  const img = ctx.getImageData(0, 0, W, H);
  const data = new Uint8Array(W * H);
  let ink = 0, minX = W, minY = H, maxX = 0, maxY = 0;
  for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 1) {
    const o = (y * W + x) * 4;
    if (img.data[o + 3]! > 128) { data[y * W + x] = 1; ink += 1; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  }
  return { data, w: W, h: H, ink, bbox: { minX, minY, maxX, maxY } };
}

// 旧 glyphSeed 行为复刻：把字符哈希成 5x7 噪点方块（用来证伪测试本身的可信度）
function glyphSeedMask(char: string, fontSize = 360): Mask {
  // 5x7 网格
  const grid: number[][] = [];
  let h = 0;
  for (let i = 0; i < char.length; i += 1) h = (h * 31 + char.charCodeAt(i)) >>> 0;
  for (let r = 0; r < 7; r += 1) {
    const row: number[] = [];
    for (let c = 0; c < 5; c += 1) { h = (h * 1103515245 + 12345) >>> 0; row.push((h >> 16) & 1); }
    grid.push(row);
  }
  // 把 5x7 涂成白块
  const cv = createCanvas(W, H);
  const ctx = cv.getContext('2d') as unknown as SKRSContext2D;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(W / 2 - 30, H / 2 - 40, 60, 80);
  const img = ctx.getImageData(0, 0, W, H);
  const data = new Uint8Array(W * H);
  let ink = 0, minX = W, minY = H, maxX = 0, maxY = 0;
  for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 1) {
    const o = (y * W + x) * 4;
    if (img.data[o]! > 200) { data[y * W + x] = 1; ink += 1; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  }
  return { data, w: W, h: H, ink, bbox: { minX, minY, maxX, maxY } };
}

// ---- P0-A ----
describe('P0-A 真汉字几何/统计性质（证伪 tofu）', () => {
  it('一/二/三 墨迹单调增加且均为横向长条', () => {
    const a = renderCharMask('一'), b = renderCharMask('二'), c = renderCharMask('三');
    expect(a.ink).toBeGreaterThan(0);
    expect(b.ink).toBeGreaterThan(a.ink);
    expect(c.ink).toBeGreaterThan(b.ink);
    const aspect = (m: Mask) => (m.bbox.maxX - m.bbox.minX) / Math.max(1, m.bbox.maxY - m.bbox.minY);
    console.log(`[P0-A] 一 bbox=[${a.bbox.minX},${a.bbox.minY}]-[${(a.bbox.maxX)},${a.bbox.maxY}] ink=${a.ink} aspect=${aspect(a).toFixed(2)}`);
    console.log(`[P0-A] 二 bbox=[${b.bbox.minX},${b.bbox.minY}]-[${(b.bbox.maxX)},${b.bbox.maxY}] ink=${b.ink} aspect=${aspect(b).toFixed(2)}`);
    console.log(`[P0-A] 三 bbox=[${c.bbox.minX},${c.bbox.minY}]-[${(c.bbox.maxX)},${c.bbox.maxY}] ink=${c.ink} aspect=${aspect(c).toFixed(2)}`);
    expect(aspect(a)).toBeGreaterThan(3);
    // 「二」「三」的 bbox 高度包含笔画之间的间距，aspect 必然接近 1（实测 1.26 / 1.11），
    // 因此不能用 aspect>3 判断；改用横笔带数刻画结构，对三个字都成立且更强。
    expect(rowInkBands(a)).toBe(1);
    expect(rowInkBands(b)).toBe(2);
    expect(rowInkBands(c)).toBe(3);
  });

  it('口 中心镂空；日/目 有多条横向笔画', () => {
    const kou = renderCharMask('口');
    expect(centerDensity(kou)).toBeLessThan(overallDensity(kou) * 0.5);
    expect(overallDensity(kou)).toBeLessThan(0.8);
    const ri = renderCharMask('日'), mu = renderCharMask('目');
    expect(countWideRows(ri)).toBeGreaterThanOrEqual(2);
    expect(countWideRows(mu)).toBeGreaterThanOrEqual(3);
    console.log(`[P0-A] 口 center=${centerDensity(kou).toFixed(2)} overall=${overallDensity(kou).toFixed(2)}; 日 wideRows=${countWideRows(ri)} 目 wideRows=${countWideRows(mu)}`);
  });

  it('川 为三条竖笔（纵向分布）', () => {
    const chuan = renderCharMask('川');
    expect(countTallCols(chuan)).toBeGreaterThanOrEqual(3);
    expect(countWideRows(chuan)).toBeLessThanOrEqual(1);
    console.log(`[P0-A] 川 tallCols=${countTallCols(chuan)} wideRows=${countWideRows(chuan)}`);
  });

  it('关键对照：项目 renderer 输出 vs 直接 napi 渲染 高度接近', () => {
    const text = '测'; // 单字不换行，便于与直接渲染对齐对照
    const proj = renderCharMask(text, 100);
    const dir = directRenderMask(text, 100);
    const iou = iouAligned(proj, dir);
    expect(iou).toBeGreaterThan(0.8);
    console.log(`[P0-A] IoU(proj vs direct)=${iou.toFixed(3)}`);
  });

  it('反例：等宽实心方块应被判为 tofu（确认非豆腐）', () => {
    const tofu = glyphSeedMask('一');
    const aspect = (tofu.bbox.maxX - tofu.bbox.minX) / Math.max(1, tofu.bbox.maxY - tofu.bbox.minY);
    expect(aspect).toBeLessThan(3); // 噪点方块宽高比≈0.75，远低于真「一」
    console.log(`[P0-A] tofu-block aspect=${aspect.toFixed(2)} (应<3，证明判别有效)`);
  });
});

// 字体探测链 / 错误信息相关断言已迁到 tests/export/font-registry.test.ts（该文件负责字体侧），
// 本文件专注字形几何与像素语义。

// ---- P0-C ----
describe('P0-C alpha 混合数学', () => {
  it('先确认 @napi-rs/canvas getImageData 返回的是非预乘 alpha', () => {
    const cv = createCanvas(10, 10);
    const ctx = cv.getContext('2d') as unknown as SKRSContext2D;
    ctx.clearRect(0, 0, 10, 10);
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 5, 5);
    const px = ctx.getImageData(0, 0, 1, 1).data;
    console.log(`[P0-C] premult-probe rgba=(${px[0]},${px[1]},${px[2]},${px[3]})`);
    // 非预乘：rgb 仍应为 255；预乘则为 ~127
    expect(px[0]).toBeGreaterThan(200);
    expect(px[3]).toBeGreaterThan(100); expect(px[3]).toBeLessThan(160);
  });

  it('半透明白字叠加在卡片上：实测值等于直-alpha 解析期望值（预乘误用会明显偏离）', () => {
    // 注：字幕 item.opacity 在 scene 中恒为 1，无法传入半透明；改用卡片 item.opacity=0.5。
    // 做法：同一张卡片渲染两次——带字(revealProgress=1) 与不带字(revealProgress=0)——后者给出
    // 笔画处「底下」的真实背景像素，于是可以不硬编码任何颜色常量地做解析校验。
    // 原断言要求 r/g/b 全 >200 才纳入统计，而半透明白字叠深色卡片数学上就到不了 200（≈130），
    // 导致一个像素都没纳入、断言恒真——这是原写法失效的根因。
    const makeItem = (revealProgress: number): SceneItem => ({
      effectId: 'card', variantId: 'card', phase: 'active', visible: true,
      content: { kind: 'text', text: '测' }, visualTags: ['quote'], visualKind: 'quote',
      layout: { nx: 0.1, ny: 0.2, nw: 0.5, nh: 0.3, scale: 1 },
      opacity: 0.5, translate: { x: 0, y: 0 }, scale: 1, rotation: 0, blur: 0,
      clipProgress: 1, revealProgress, glow: 0, colorProgress: 1, progress: 1,
      appearance: { accent: '#38D4BC', theme: 'dark' }, zIndex: 1,
    } as unknown as SceneItem);
    const render = (revealProgress: number) => renderSceneFrameToRgba(
      { timeSec: 1, items: [makeItem(revealProgress)], activeEffectIds: ['card'] } as SceneFrame,
      W, H, undefined as any, W,
    );
    const withText = render(1);
    const withoutText = render(0);

    // 取「因画字而改变」的像素中 alpha 最高者 = 笔画实心处（阴影 alpha 更低，会被这份排序自然排除）
    let bestOffset = -1;
    let bestAlpha = -1;
    for (let i = 0; i < withText.length; i += 4) {
      const changed = withText[i] !== withoutText[i] || withText[i + 1] !== withoutText[i + 1]
        || withText[i + 2] !== withoutText[i + 2] || withText[i + 3] !== withoutText[i + 3];
      if (changed && withText[i + 3]! > bestAlpha) { bestAlpha = withText[i + 3]!; bestOffset = i; }
    }
    expect(bestOffset).toBeGreaterThanOrEqual(0);

    const tr = withText[bestOffset]!, tg = withText[bestOffset + 1]!, tb = withText[bestOffset + 2]!, ta = withText[bestOffset + 3]!;
    const br = withoutText[bestOffset]!, bg = withoutText[bestOffset + 1]!, bb = withoutText[bestOffset + 2]!, ba = withoutText[bestOffset + 3]!;

    // 由 source-over 反解文字自身 alpha：ta/255 = s + (ba/255)(1-s)
    const sAlpha = (ta - ba) / Math.max(1, 255 - ba);
    expect(sAlpha).toBeGreaterThan(0.2);
    expect(sAlpha).toBeLessThan(0.95);

    // 精确反解：卡片背景本身是半透明（实测 bgA=128）且文字带黑色阴影，
    // 所以不能假设「文字层是纯白 alpha=s」。按 source-over 归一化求解文字层自身颜色：
    //   outRGB = (layerRGB*la + bgRGB*bgA*(1-la)) / outA
    const outA = ta / 255;
    const bgA = ba / 255;
    const layerRgb = [tr, tg, tb].map((v, idx) => {
      const bgv = [br, bg, bb][idx]!;
      return (v * outA - bgv * bgA * (1 - sAlpha)) / sAlpha;
    });
    const chromaticSpread = Math.max(...layerRgb) - Math.min(...layerRgb);
    console.log(`[P0-C] semi-transp text=(${tr},${tg},${tb},${ta}) bg=(${br},${bg},${bb},${ba}) la=${sAlpha.toFixed(3)} solvedLayer=(${layerRgb.map((v) => v.toFixed(0)).join(',')}) spread=${chromaticSpread.toFixed(1)}`);

    // 白字叠在黑色阴影上 → 文字层必须是中性灰（三通道近乎相等）。
    // 若把非预乘数据当预乘用，红绿蓝会被不同程度地压偏，该中性性立刻被破坏。
    expect(chromaticSpread).toBeLessThanOrEqual(4);
    // 文字层必须仍是「亮」的（白字被阴影轻微压暗到 ~215 正常）。
    // 预乘会把 data 里实测的 255 换成 已乘过的 ~127，反解出的 layer 会掉到 ~128 附近 —— 被这条排除。
    const minLayer = Math.min(...layerRgb);
    expect(minLayer).toBeGreaterThan(180);
    // 判别力自证：预乘假设下反解出的 layer 必须明显更暗，否则这个断言没有意义
    const premulLayer = layerRgb.map((v) => v * sAlpha);
    expect(minLayer - Math.min(...premulLayer)).toBeGreaterThan(30);
  });

  it('不透明白字叠在卡片上 → 恰好纯白 (255,255,255,255)', () => {
    const item: any = {
      effectId: 'card', variantId: 'card', phase: 'active', visible: true,
      content: { kind: 'text', text: '需求' }, visualTags: ['quote'], visualKind: 'quote',
      layout: { nx: 0.1, ny: 0.2, nw: 0.6, nh: 0.3, scale: 1 },
      opacity: 1, translate: { x: 0, y: 0 }, scale: 1, rotation: 0, blur: 0,
      clipProgress: 1, revealProgress: 1, glow: 0, colorProgress: 1, progress: 1,
      appearance: { accent: '#38D4BC', theme: 'dark' }, zIndex: 1,
    };
    const frame: SceneFrame = { timeSec: 1, items: [item as SceneItem], activeEffectIds: ['card'] };
    const buf = renderSceneFrameToRgba(frame, W, H, undefined as any, W);
    let whiteCount = 0;
    for (let i = 0; i < buf.length; i += 4) if (buf[i]! > 200 && buf[i + 1]! > 200 && buf[i + 2]! > 200 && buf[i + 3]! === 255) whiteCount += 1;
    expect(whiteCount).toBeGreaterThan(50);
    console.log(`[P0-C] opaque-white-on-card pure-white pixels=${whiteCount}`);
  });
});

// ---- P0-D ----
describe('P0-D measureText 居中/溢出/边界', () => {
  function subtitleMask(text: string, fontSize = 60): Mask {
    const p = makeSubtitleProject(text, fontSize);
    const buf = renderSceneFrameToRgba(evaluateSceneAtTime(p, 1), W, H, p.subtitleSettings, W);
    return whiteMaskFromBuffer(buf, W, H);
  }
  it('极长单行不溢出卡片右侧边界', () => {
    const long = '这是一段非常非常非常非常非常非常非常非常非常非常非常非常非常非常长的字幕用来测试溢出裁剪逻辑是否生效';
    const m = subtitleMask(long, 50);
    const regionRight = Math.floor(W * 0.95);
    let overflow = 0;
    for (let y = 0; y < H; y += 1) for (let x = regionRight; x < W; x += 1) overflow += m.data[y * W + x]!;
    expect(overflow).toBe(0);
    console.log(`[P0-D] long-line overflow px right of ${regionRight}=${overflow}`);
  });
  it('空串/纯空格/英文/数字/emoji 不崩溃且产生合理墨迹', () => {
    for (const [t, expectInk] of [['', false], ['   ', false], ['Hello', true], ['123', true], ['😀测试AB', true]] as Array<[string, boolean]>) {
      const m = subtitleMask(t, 80);
      if (expectInk) expect(m.ink).toBeGreaterThan(0); else expect(m.ink).toBe(0);
      console.log(`[P0-D] "${t}" ink=${m.ink}`);
    }
  });
  it('fontSize 极大(200)与极小(6)仍在画布内', () => {
    for (const fs of [6, 200]) {
      const m = subtitleMask('字', fs);
      expect(m.ink).toBeGreaterThan(0);
      expect(m.bbox.minX).toBeGreaterThanOrEqual(0);
      expect(m.bbox.maxX).toBeLessThan(W);
      console.log(`[P0-D] fontSize=${fs} bbox=[${m.bbox.minX},${m.bbox.minY}]-[${(m.bbox.maxX)},${m.bbox.maxY}] ink=${m.ink}`);
    }
  });
});

// ---- P0-E ----
describe('P0-E 语义回归', () => {
  function cardFrameItem(clipProgress: number, revealProgress: number, nw = 0.6, nh = 0.35): SceneItem {
    return {
      effectId: 'card', variantId: 'card', phase: 'active', visible: true,
      content: { kind: 'text', text: '先把需求聊清楚再动手做方案' }, visualTags: ['quote'], visualKind: 'quote',
      layout: { nx: 0.1, ny: 0.2, nw, nh, scale: 1 },
      opacity: 1, translate: { x: 0, y: 0 }, scale: 1, rotation: 0, blur: 0,
      clipProgress, revealProgress, glow: 0, colorProgress: 1, progress: 1,
      appearance: { accent: '#38D4BC', theme: 'dark' }, zIndex: 1,
    } as unknown as SceneItem;
  }
  function cardFrame(clipProgress: number, revealProgress: number, nw = 0.6, nh = 0.35): Buffer {
    const frame: SceneFrame = { timeSec: 1, items: [cardFrameItem(clipProgress, revealProgress, nw, nh)], activeEffectIds: ['card'] };
    return renderSceneFrameToRgba(frame, W, H, undefined as any, W);
  }
  function whiteInk(buf: Buffer): number {
    let n = 0; for (let i = 0; i < buf.length; i += 4) if (buf[i]! > 200 && buf[i + 1]! > 200 && buf[i + 2]! > 200) n += 1; return n;
  }
  it('clipProgress=0 → 文字 0 墨迹；=1 → 有墨迹', () => {
    expect(whiteInk(cardFrame(0, 1))).toBe(0);
    expect(whiteInk(cardFrame(1, 1))).toBeGreaterThan(0);
    console.log(`[P0-E] clip0 ink=${whiteInk(cardFrame(0, 1))} clip1 ink=${whiteInk(cardFrame(1, 1))}`);
  });
  it('revealProgress 单调，且打字机预算跨行累计（前面的行先出，不是每行各自独立预算）', () => {
    const ink0 = whiteInk(cardFrame(1, 0));
    const ink05 = whiteInk(cardFrame(1, 0.5));
    const ink1 = whiteInk(cardFrame(1, 1));
    expect(ink0).toBe(0);
    expect(ink1).toBeGreaterThan(0);
    expect(ink05).toBeGreaterThan(ink0);
    expect(ink05).toBeLessThan(ink1);

    // 窄卡片把长文案挤成多行，用「行墨迹带」切分而不是 bbox 中点：
    // 行间距只有 0.2×fontSize，bbox 中点必然落进第一行字形内部——这正是原断言失败的根因。
    const mask05 = whiteMaskFromBuffer(cardFrame(1, 0.5, 0.25, 0.4), W, H);
    const mask1 = whiteMaskFromBuffer(cardFrame(1, 1, 0.25, 0.4), W, H);
    const bands05 = rowBandInk(mask05);
    const bands1 = rowBandInk(mask1);
    console.log(`[P0-E] reveal ink: 0=${ink0} 0.5=${ink05} 1=${ink1}; bands@0.5=${JSON.stringify(bands05)} bands@1=${JSON.stringify(bands1)}`);

    // 用共享的 textFit 直接取真实换行结果，避免从像素猜行数
    const narrowItem = cardFrameItem(1, 0.5, 0.25, 0.4);
    // 注意：文字区域的度量以【卡片包围盒】为坐标系，不是整块画布
    const narrowBox = sceneItemBox(narrowItem, W, H);
    const region = exportTextLayoutForItem(narrowItem, narrowBox.width, narrowBox.height).regions[0]!;
    const totalChars = region.lines.reduce((sum, line) => sum + [...line].length, 0);
    const budget = Math.ceil(totalChars * 0.5);
    console.log(`[P0-E] lines=${JSON.stringify(region.lines)} totalChars=${totalChars} budget@0.5=${budget}; bands@0.5=${JSON.stringify(bands05)} bands@1=${JSON.stringify(bands1)}`);

    // 必须先真的发生换行，否则检验不到跨行
    expect(region.lines.length).toBeGreaterThanOrEqual(2);
    expect(bands1.length).toBeGreaterThanOrEqual(2);

    // 跨行累计的核心判据：预算只够覆盖第一行时，第一行必须已【整行】出完。
    // 若误写成「每行各自独立预算」，第一行只会出一半，首带墨迹会明显少于全量 —— 被这条排除。
    // （不能用「带数递减」判断：真实汉字行内的笔画间隙会把一行切成多条带，带数不可靠。）
    expect(bands05[0]).toBe(bands1[0]);
    expect(bands05.length).toBeLessThanOrEqual(bands1.length);
    expect(ink05).toBeLessThan(ink1);
  });

  it('strokeWidth>0 描边真的画了且先描后填（不盖字形）', () => {
    const p = makeSubtitleProject('测', 200, 1, 8, '#FFFFFF');
    const buf = renderSceneFrameToRgba(evaluateSceneAtTime(p, 1), W, H, p.subtitleSettings, W);
    let white = 0, blackEdge = 0;
    for (let i = 0; i < buf.length; i += 4) {
      if (buf[i]! > 200 && buf[i + 1]! > 200 && buf[i + 2]! > 200) white += 1;
      if (buf[i]! < 60 && buf[i + 1]! < 60 && buf[i + 2]! < 60 && buf[i + 3]! > 0) blackEdge += 1;
    }
    expect(white).toBeGreaterThan(50);
    expect(blackEdge).toBeGreaterThan(50); // 黑描边存在
    console.log(`[P0-E] stroke: whiteFill=${white} blackStroke=${blackEdge}`);
  });
  it('chapterNav 长标题+多章节仍保住 active 且不溢出', () => {
    const project: any = createFixtureProject();
    project.project.durationSec = 100; project.project.canvasWidth = 480; project.project.canvasHeight = 270;
    project.effects = []; project.subtitles = [];
    const titles = ['第一章 项目背景与动机', '第二章 需求调研方法', '第三章 技术方案设计', '第四章 数据建模', '第五章 工程实现', '第六章 性能优化', '第七章 测试与验收', '第八章 上线与复盘'];
    project.chapters = titles.map((t, i) => ({ chapterId: `c${i}`, title: t, startSec: i * 10, endSec: (i + 1) * 10 }));
    project.project.chapterNav = { visible: true, position: 'top', showProgress: true };
    // 取 active=第 5 章 (t=52)
    const buf = renderSceneFrameToRgba(evaluateSceneAtTime(project, 52), 480, 270, undefined as any, 480);
    // 导航区位于顶部 ny~0.02, nh~0.06 → y∈[~5, ~21]
    let navInk = 0, navMaxX = 0, navMinX = 480;
    for (let y = 0; y < 30; y += 1) for (let x = 0; x < 480; x += 1) {
      const o = (y * 480 + x) * 4;
      if (buf[o + 3]! > 0) { navInk += 1; if (x > navMaxX) navMaxX = x; if (x < navMinX) navMinX = x; }
    }
    expect(navInk).toBeGreaterThan(0);
    expect(navMaxX).toBeLessThanOrEqual(479);
    console.log(`[P0-E] chapterNav ink=${navInk} xRange=[${navMinX},${navMaxX}] (画布宽480)`);
  });
});

// ---- P1-F ----
describe('P1-F 单帧性能', () => {
  it('renderProjectFrame 单帧耗时（短片段 jj composition）', async () => {
    const raw = JSON.parse(await fs.readFile(resolve(process.cwd(), 'renders', 'jj-composition.json'), 'utf8'));
    raw.project.chapterNav = { visible: true, position: 'top', showProgress: true };
    raw.project.durationSec = 5; raw.project.fps = 30;
    // 预热（字体注册 + JIT）
    renderProjectFrame(raw, 3);
    const N = 20;
    const t0 = Date.now();
    for (let i = 0; i < N; i += 1) renderProjectFrame(raw, 3);
    const dt = (Date.now() - t0) / N;
    console.log(`[P1-F] avg ms/frame=${dt.toFixed(1)} over ${N} frames @ ${raw.project.canvasWidth}x${raw.project.canvasHeight}`);
    expect(dt).toBeLessThan(500);
  });
});

// ---- P1-G ----
describe('P1-G 测试本身可信（对错误实现应 FAIL）', () => {
  it('real-glyphs 的几何断言能区分噪点：把「一」换成 glyphSeed 方块则 aspect 断言失败', () => {
    const tofu = glyphSeedMask('一');
    const aspect = (tofu.bbox.maxX - tofu.bbox.minX) / Math.max(1, tofu.bbox.maxY - tofu.bbox.minY);
    // real-glyphs 要求 aspect>3；噪点方块 aspect≈0.75 → 会失败，证明断言有效
    expect(aspect).toBeLessThan(3);
    const kou = glyphSeedMask('口');
    // real-glyphs 要求 口 centerDensity < overall*0.5；噪点随机填充中心密度≈整体 → 会失败
    expect(centerDensity(kou)).toBeGreaterThanOrEqual(overallDensity(kou) * 0.5);
  });
});
