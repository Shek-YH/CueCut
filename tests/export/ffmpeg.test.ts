import { describe, expect, it } from 'vitest';
import { createFfmpegCommand, createRawVideoFfmpegCommand } from '../../src/export/ffmpeg';

describe('host FFmpeg export adapter', () => {
  it('plans a Full Video command with audio and the unified renderer input', () => {
    expect(createFfmpegCommand({
      mode: 'full-video',
      inputPath: 'input.mp4',
      renderFramesPath: 'rendered.mp4',
      outputPath: 'exports/final.mp4',
    })).toEqual([
      '-y',
      '-i', 'input.mp4',
      '-i', 'rendered.mp4',
      '-filter_complex', '[0:v][1:v]overlay=0:0:format=auto[v]',
      '-map', '[v]',
      '-map', '0:a?',
      '-c:v', 'libx264',
      '-c:a', 'aac',
      'exports/final.mp4',
    ]);
  });

  it('plans Transparent MOV as alpha-capable ProRes and never as a PNG sequence', () => {
    const command = createFfmpegCommand({
      mode: 'transparent-mov',
      inputPath: 'rendered-rgba.mov',
      outputPath: 'exports/overlay.mov',
    });

    expect(command).toEqual([
      '-y',
      '-i', 'rendered-rgba.mov',
      '-c:v', 'prores_ks',
      '-profile:v', '4444',
      '-pix_fmt', 'yuva444p10le',
      '-an',
      'exports/overlay.mov',
    ]);
    expect(command.join(' ')).not.toContain('png');
  });

  it('accepts a streamed RGBA renderer input for actual encoding', () => {
    expect(createRawVideoFfmpegCommand({
      mode: 'full-video',
      inputPath: 'input.mp4',
      outputPath: 'exports/final.mp4',
      width: 1920,
      height: 1080,
      fps: 29.97,
      durationSec: 5,
    })).toEqual([
      '-y',
      '-i', 'input.mp4',
      '-f', 'rawvideo',
      '-pix_fmt', 'rgba',
      '-s', '1920x1080',
      '-r', '29.97',
      '-i', 'pipe:0',
      '-filter_complex', '[0:v][1:v]overlay=0:0:format=auto[v]',
      '-map', '[v]',
      '-map', '0:a?',
      '-t', '5',
      '-c:v', 'libx264',
      '-c:a', 'aac',
      'exports/final.mp4',
    ]);
  });
});
