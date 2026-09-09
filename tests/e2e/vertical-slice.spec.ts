import { expect, test } from '@playwright/test';
import { createFixtureProject } from '../../src/project/fixtures';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

test.use({ viewport: { width: 1920, height: 1080 } });

const realMedia16x9 = process.env.CUECUT_REAL_MEDIA_16_9;
const realMedia9x16 = process.env.CUECUT_REAL_MEDIA_9_16;
const portableFixture = path.resolve('test-results/cuecut-e2e-fixture.mp4');

test.describe('CueCut first vertical slice', () => {
  test.beforeAll(() => {
    execFileSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', 'scripts/create-test-video.ps1', '-OutputPath', portableFixture]);
  });
  test('preserves the prototype layout at the required desktop widths', async ({ page }) => {
    for (const viewport of [
      { width: 1920, height: 1080 },
      { width: 1600, height: 900 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await expect(page.getByTestId('layers-panel')).toBeVisible();
      await expect(page.getByTestId('srt-panel')).toBeVisible();
      await expect(page.getByTestId('canvas-stage')).toBeVisible();
      await expect(page.getByTestId('inspector')).toBeVisible();
      await expect(page.getByTestId('timeline')).toBeVisible();
    }

    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.screenshot({ path: 'docs/evidence/screenshots/01-edit-workspace.png', fullPage: true });
  });

  test('imports the supplied local 16:9 MP4 and reads host video metadata', async ({ page }) => {
    test.skip(!realMedia16x9, 'Set CUECUT_REAL_MEDIA_16_9 to run the optional real-media test');
    await page.goto('/');
    await page.getByTestId('video-input').setInputFiles(realMedia16x9!);

    await expect(page.locator('.file-name')).toContainText('jj.mp4');
    const video = page.getByTestId('preview-video');
    await expect(video).toHaveAttribute('src', /^blob:/);
    await expect.poll(async () => video.evaluate((element) => (element as HTMLVideoElement).readyState)).toBeGreaterThan(0);
    await expect(video).toHaveJSProperty('muted', false);
    await page.keyboard.press('Space');
    await expect(page.getByRole('button', { name: '❚❚ 暂停' })).toBeVisible();
    await expect.poll(async () => video.evaluate((element) => (element as HTMLVideoElement).paused)).toBe(false);
    await expect(page.locator('.time')).toContainText('222.10s');
  });

  test('seeks on the timeline while native video playback stays active', async ({ page }) => {
    test.skip(!realMedia16x9, 'Set CUECUT_REAL_MEDIA_16_9 to run the optional real-media test');
    await page.goto('/');
    await page.getByTestId('video-input').setInputFiles(realMedia16x9!);
    const video = page.getByTestId('preview-video');
    await expect.poll(async () => video.evaluate((element) => (element as HTMLVideoElement).readyState)).toBeGreaterThan(0);
    await expect(page.locator('.time')).toContainText('222.10s');
    await page.keyboard.press('Space');
    await expect.poll(async () => video.evaluate((element) => (element as HTMLVideoElement).paused)).toBe(false);

    const content = page.locator('.content');
    const box = await content.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;
    await page.mouse.click(box.x + box.width * 0.5, box.y + 12);

    await expect(page.getByRole('button', { name: '❚❚ 暂停' })).toBeVisible();
    await expect.poll(async () => video.evaluate((element) => (element as HTMLVideoElement).currentTime)).toBeGreaterThan(100);
  });

  test('imports the supplied local 9:16 MP4 and switches the Canvas aspect ratio', async ({ page }) => {
    test.skip(!realMedia9x16, 'Set CUECUT_REAL_MEDIA_9_16 to run the optional real-media test');
    await page.goto('/');
    await page.getByTestId('video-input').setInputFiles(realMedia9x16!);

    await expect(page.locator('.file-name')).toContainText('1787042165.mp4');
    const video = page.getByTestId('preview-video');
    await expect.poll(async () => video.evaluate((element) => (element as HTMLVideoElement).readyState)).toBeGreaterThan(0);
    await expect(page.locator('.time')).toContainText('62.65s');
    const canvas = page.locator('.canvas');
    await expect(canvas).toHaveAttribute('data-aspect-ratio', '9:16');
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    if (!canvasBox) return;
    expect(canvasBox.height).toBeLessThan(700);
    await expect(page.locator('.safe')).toBeVisible();
    await page.screenshot({ path: 'docs/evidence/screenshots/08-real-portrait-9x16.png', fullPage: true });
  });

  test('runs the video-to-SRT-to-Director flow and auto-loads Workspace', async ({ page }) => {
    const composition = createFixtureProject();
    composition.project.projectId = 'generated-e2e';
    composition.project.durationSec = 12;
    composition.project.canvasWidth = 1080;
    composition.project.canvasHeight = 1920;
    composition.project.aspectRatio = '9:16';
    composition.project.video.sourceFileName = 'synthetic.mp4';
    composition.effects = [composition.effects[0]!];
    composition.effects[0]!.time = { startSec: 1, endSec: 4 };

    let apiCalls = 0;
    await page.route('**/api/generate-effects', async (route) => {
      apiCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          transcript: [{ id: 's-generated', startSec: 0, endSec: 2.5, text: 'Generated subtitle' }],
          composition,
          warnings: [],
          usedFallback: false,
          asrRequestId: 'asr-e2e',
          asrDurationSec: 12,
        }),
      });
    });
    await page.route('**/api/probe-video', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ durationSec: 12, fps: 30, width: 1080, height: 1920 }) });
    });

    await page.goto('/');
    await page.getByTestId('video-input').setInputFiles({ name: 'synthetic.mp4', mimeType: 'video/mp4', buffer: Buffer.from('synthetic-video') });
    await page.getByRole('button', { name: '开始生成动效' }).click();

    await expect(page.locator('textarea[aria-label="SRT s-generated"]')).toHaveValue('Generated subtitle');
    await expect(page.getByTestId('generation-status')).toHaveText('已载入 Workspace');
    await expect(page.getByTestId('effect-card-fx-quote')).toHaveCount(0);
    expect(apiCalls).toBe(1);
  });

  test('seeks from SRT and keeps the Playhead independent from an Effect clip drag', async ({ page }) => {
    await page.goto('/');
    await page.locator('#srt-file-input').setInputFiles({ name: 'fixture.srt', mimeType: 'text/plain', buffer: Buffer.from('1\n00:00:02,200 --> 00:00:05,700\nFixture subtitle\n') });
    await page.getByTestId('srt-s-1').locator('.srttop').click();
    await expect(page.locator('.time')).toContainText('2.20s');

    const playheadBefore = await page.locator('.playhead').evaluate((element) => element.getAttribute('style'));
    const clip = page.getByLabel('fx-ring effect clip');
    const box = await clip.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 80, box.y + box.height / 2);
    await page.mouse.up();

    const playheadAfter = await page.locator('.playhead').evaluate((element) => element.getAttribute('style'));
    expect(playheadAfter).toBe(playheadBefore);
  });

  test('drags a Canvas Effect Card without moving the Playhead', async ({ page }) => {
    await page.goto('/');
    const card = page.getByTestId('effect-card-fx-ring');
    const before = await card.getAttribute('style');
    const playheadBefore = await page.locator('.playhead').getAttribute('style');
    const box = await card.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 40, box.y + 20);
    await page.mouse.up();

    expect(await card.getAttribute('style')).not.toBe(before);
    expect(await page.locator('.playhead').getAttribute('style')).toBe(playheadBefore);
  });

  test('resizes a Canvas Effect Card with its corner handle', async ({ page }) => {
    await page.goto('/');
    const card = page.getByTestId('effect-card-fx-ring');
    const before = await card.getAttribute('style');
    const handle = page.getByTestId('resize-handle-fx-ring-bottom-right');
    const box = await handle.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 24, box.y + 16);
    await page.mouse.up();

    expect(await card.getAttribute('style')).not.toBe(before);
  });

  test('keeps Effect Lab changes local until Apply and creates one undoable commit', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '在 Effect Lab 中试模板 / 进出场 / 颜色' }).click();
    await expect(page.getByTestId('effect-lab')).toBeVisible();

    await page.getByRole('button', { name: 'B', exact: true }).click();
    await page.getByRole('button', { name: '取消', exact: true }).click();
    await page.getByRole('button', { name: '在 Effect Lab 中试模板 / 进出场 / 颜色' }).click();
    await expect(page.getByRole('button', { name: 'A', exact: true })).toHaveClass(/on/);

    await page.getByRole('button', { name: 'B', exact: true }).click();
    await page.getByRole('button', { name: '应用到 Workspace' }).click();
    await expect(page.getByTestId('inspector')).toContainText('ring-b');

    await page.getByRole('button', { name: '↶' }).click();
    await expect(page.getByTestId('inspector')).toContainText('ring-a');
  });

  test('captures the prototype-mapped navigation views as local evidence', async ({ page }) => {
    await page.goto('/');
    await page.screenshot({ path: 'docs/evidence/screenshots/01-edit-workspace.png', fullPage: true });

    await page.getByRole('button', { name: /动效库/ }).click();
    await expect(page.getByTestId('effect-lab')).toBeVisible();
    await page.screenshot({ path: 'docs/evidence/screenshots/02-effect-lab.png', fullPage: true });
    await page.getByRole('button', { name: '只看入场' }).click();
    await page.screenshot({ path: 'docs/evidence/screenshots/03-effect-lab-motion-preview.png', fullPage: true });

    await page.getByRole('button', { name: /音效库/ }).click();
    await expect(page.getByTestId('sfx-view')).toBeVisible();
    await page.screenshot({ path: 'docs/evidence/screenshots/04-sfx-library.png', fullPage: true });
    await page.getByRole('button', { name: '★ 收藏' }).click();
    await page.screenshot({ path: 'docs/evidence/screenshots/05-sfx-favorites.png', fullPage: true });

    await page.getByRole('button', { name: /自进化/ }).click();
    await expect(page.getByTestId('learn-view')).toBeVisible();
    await page.screenshot({ path: 'docs/evidence/screenshots/06-preference-evolution.png', fullPage: true });

    await page.getByRole('button', { name: /编辑/ }).click();
    await page.getByRole('button', { name: 'Fit' }).click();
    await page.screenshot({ path: 'docs/evidence/screenshots/07-timeline-expanded.png', fullPage: true });
  });

  test('downloads actual MP4 and transparent MOV through the export button', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('video-input').setInputFiles(portableFixture);
    await expect(page.locator('.file-name')).toContainText('cuecut-e2e-fixture.mp4');
    await expect(page.getByRole('button', { name: '导出', exact: true })).toBeEnabled();

    const mp4Download = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出', exact: true }).click();
    expect((await mp4Download).suggestedFilename()).toBe('cuecut-export.mp4');

    await page.getByLabel('导出模式').selectOption('transparent-mov');
    const movDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出', exact: true }).click();
    expect((await movDownload).suggestedFilename()).toBe('cuecut-overlay.mov');
  }, 120_000);
});
