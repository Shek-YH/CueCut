import { expect, test } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

test.use({ viewport: { width: 1920, height: 1080 } });

test('captures real jj CueCut composition at 10s and 60s', async ({ page }) => {
  test.skip(process.env.CUECUT_REALTIME_REAL_PROJECT !== '1', 'Set CUECUT_REALTIME_REAL_PROJECT=1 for the real project benchmark');
  test.setTimeout(180_000);
  const project = JSON.parse(readFileSync(path.resolve('renders/jj-cuecut-composition.json'), 'utf8')) as Record<string, unknown>;
  mkdirSync(path.resolve('renders/realtime-capture'), { recursive: true });
  await page.goto('/');
  const measurements: Array<Record<string, unknown>> = [];
  for (const durationSec of [10, 60]) {
    const downloadPromise = page.waitForEvent('download');
    const result = await page.evaluate(async ({ project, durationSec }) => {
      const [{ createRealtimeCaptureController }, { createBrowserCanvasCaptureBackend }, { createCaptureSceneSurface }] = await Promise.all([
        import('/src/export/realtime/controller.ts'),
        import('/src/export/realtime/browserCanvasBackend.ts'),
        import('/src/export/realtime/captureScene.ts'),
      ]);
      const backend = createBrowserCanvasCaptureBackend();
      const controller = createRealtimeCaptureController({ backend, forceEnabled: true, createSurface: (composition, options) => createCaptureSceneSurface(composition, options) });
      const capture = await controller.start({ project: project as never, projectName: 'jj-real', durationSecOverride: durationSec });
      const url = URL.createObjectURL(capture.blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = capture.fileName;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      return { durationSec, fileName: capture.fileName, health: capture.health, media: capture.media };
    }, { project, durationSec });
    measurements.push(result);
    const download = await downloadPromise;
    await download.saveAs(path.resolve('renders/realtime-capture/real-jj-' + durationSec + 's.' + (result.fileName.split('.').pop() ?? 'webm')));
  }
  expect(measurements).toHaveLength(2);
});
