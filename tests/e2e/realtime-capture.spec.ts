import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

test.use({ viewport: { width: 1920, height: 1080 } });

test('captures real 10s and 60s CueCut timelines in Chromium', async ({ page }) => {
  test.skip(process.env.VITE_REALTIME_CHROMA_CAPTURE !== 'true', 'Set VITE_REALTIME_CHROMA_CAPTURE=true for the real MediaRecorder benchmark');
  test.setTimeout(180_000);
  mkdirSync(path.resolve('renders/realtime-capture'), { recursive: true });
  await page.goto('/');
  const panel = page.getByTestId('realtime-capture-panel');
  await expect(panel).toBeVisible();
  const metrics: Array<Record<string, unknown>> = [];

  for (const duration of ['10', '60']) {
    await panel.getByLabel('Benchmark duration').selectOption(duration);
    await panel.getByRole('button', { name: '极速抠像' }).click();
    await expect(panel.getByText('状态：SUCCESS')).toBeVisible({ timeout: duration === '60' ? 120_000 : 30_000 });
    await expect(panel.getByText(/Dropped Frames: 0/)).toBeVisible();
    await expect(panel.getByText(/Capture FPS:/)).toBeVisible();
    await expect(panel.getByText(/Drift:/)).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await panel.getByRole('button', { name: /下载/ }).click();
    const download = await downloadPromise;
    const extension = download.suggestedFilename().split('.').pop() ?? 'webm';
    const outputPath = path.resolve('renders/realtime-capture/fixture-' + duration + 's.' + extension);
    await download.saveAs(outputPath);
    const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'format=format_name,duration,size:stream=codec_name,width,height,r_frame_rate,avg_frame_rate,nb_read_frames', '-of', 'json', '--', outputPath], { encoding: 'utf8' })) as { streams?: Array<Record<string, string>>; format?: Record<string, string> };
    metrics.push({ durationSec: Number(duration), panel: await panel.textContent(), probe });
    writeFileSync(path.resolve('renders/realtime-capture/metrics.json'), JSON.stringify(metrics, null, 2));
    expect(Number(probe.streams?.[0]?.nb_read_frames)).toBeGreaterThanOrEqual(Math.ceil(Number(duration) * 30) - 1);
    expect(download.suggestedFilename()).toMatch(/_Chroma_.*\.(mp4|webm)$/);
  }
});
