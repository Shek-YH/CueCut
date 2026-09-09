import { rm } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { createFixtureProject } from '../../src/project/fixtures';
import { createExportController } from '../../src/export/controller';
import { probeVideoFile } from '../../src/media/videoProbe';

const mediaPaths = [process.env.CUECUT_REAL_MEDIA_16_9, process.env.CUECUT_REAL_MEDIA_9_16].filter((value): value is string => Boolean(value));

describe('optional real-media export', () => {
  it.skipIf(!mediaPaths.length)('exports a one-second segment from each authorized real media fixture', async () => {
    for (const mediaPath of mediaPaths) {
      const metadata = await probeVideoFile(mediaPath);
      const project = createFixtureProject();
      project.project.durationSec = 1;
      project.project.fps = metadata.fps;
      project.project.canvasWidth = metadata.width;
      project.project.canvasHeight = metadata.height;
      project.project.aspectRatio = metadata.width >= metadata.height ? '16:9' : '9:16';
      project.project.video.sourceFileName = mediaPath.split(/[\\/]/).pop() ?? 'real-media.mp4';
      project.effects = [project.effects[0]!];
      project.effects[0]!.time = { startSec: 0.1, endSec: 0.9 };
      project.subtitles = [{ id: 'real-subtitle', startSec: 0.2, endSec: 0.8, text: 'Real media test' }];
      const outputPath = `test-results/cuecut-real-media-${metadata.width}x${metadata.height}.mp4`;
      await rm(outputPath, { force: true });

      const result = await createExportController().start({ mode: 'full-video', project, inputPath: mediaPath, outputPath });

      expect(result.metadata).toMatchObject({ width: metadata.width, height: metadata.height, hasAudio: true, pixelFormat: expect.any(String) });
      expect(result.metadata.durationSec).toBeCloseTo(1, 1);
    }
  }, 120_000);
});
