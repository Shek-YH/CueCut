import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createBailianAsrClient } from '../../src/media/bailianAsr';
import { serializeSrt } from '../../src/subtitles/srt';

const runRealAsr = process.env.CUECUT_RUN_REAL_ASR === '1';

describe('real Bailian ASR output segmentation', () => {
  (runRealAsr ? it : it.skip)('writes timestamped SRT blocks from the supplied jj.mp4 audio', async () => {
    const projectRoot = 'F:\\CCPJ\\CueCut3';
    const envLines = (await fs.readFile(join(projectRoot, '测试素材与api', '.env'), 'utf8')).split(/\r?\n/);
    const sectionIndex = envLines.findIndex((line) => line.trim() === '阿里云百炼');
    const keyLine = envLines.slice(sectionIndex + 1).find((line) => /^API KEY\s*=/.test(line));
    const apiKey = keyLine?.replace(/^API KEY\s*=\s*/, '').trim();
    if (!apiKey) throw new Error('Bailian API key is not configured');

    const audioPath = join(projectRoot, 'renders', 'jj-asr-input.mp3');
    const outputPath = join(projectRoot, 'renders', 'jj-asr.srt');
    const evidencePath = join(projectRoot, 'docs', 'evidence', 'WI-008-real-jj-asr-2026-09-08.json');
    const audioDataUri = 'data:audio/mpeg;base64,' + (await fs.readFile(audioPath)).toString('base64');
    const client = createBailianAsrClient({ apiKey });
    const result = await client.transcribe({ audioDataUri, format: 'mp3', sampleRate: 16000, languageHints: ['zh'] });

    await fs.writeFile(outputPath, serializeSrt(result.segments), 'utf8');
    await fs.writeFile(evidencePath, JSON.stringify({
      scenario: 'RT-03 attached jj.mp4 ASR segmentation',
      inputVideo: join(projectRoot, '测试素材与api', 'jj.mp4'),
      model: 'qwen-audio-3.0-asr-flash',
      provider: 'Alibaba Bailian',
      requestId: result.requestId,
      processedDurationSec: result.processedDurationSec,
      segmentCount: result.segments.length,
      firstTiming: result.segments[0] ? { startSec: result.segments[0].startSec, endSec: result.segments[0].endSec } : null,
      lastTiming: result.segments.at(-1) ? { startSec: result.segments.at(-1)!.startSec, endSec: result.segments.at(-1)!.endSec } : null,
      outputSrt: outputPath,
      apiKeyRecorded: false,
      fullTranscriptRecorded: false,
    }, null, 2), 'utf8');
    expect(result.segments.length).toBeGreaterThan(1);
    expect(result.segments.every((segment) => segment.endSec > segment.startSec)).toBe(true);
  }, 120_000);
});
