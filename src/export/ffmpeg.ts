export type FfmpegExportInput =
  | { mode: 'full-video'; inputPath: string; renderFramesPath: string; outputPath: string }
  | { mode: 'transparent-mov'; inputPath: string; outputPath: string }
  | { mode: 'transparent-webm'; inputPath: string; outputPath: string };

export type RawVideoFfmpegInput =
  | { mode: 'full-video'; inputPath: string; outputPath: string; width: number; height: number; fps: number; durationSec: number }
  | { mode: 'transparent-mov'; outputPath: string; width: number; height: number; fps: number; durationSec: number }
  | { mode: 'transparent-webm'; outputPath: string; width: number; height: number; fps: number; durationSec: number };

export function createFfmpegCommand(input: FfmpegExportInput): string[] {
  if (input.mode === 'full-video') {
    return [
      '-y',
      '-i', input.inputPath,
      '-i', input.renderFramesPath,
      '-filter_complex', '[0:v][1:v]overlay=0:0:format=auto[v]',
      '-map', '[v]',
      '-map', '0:a?',
      '-c:v', 'libx264',
      '-c:a', 'aac',
      input.outputPath,
    ];
  }

  if (input.mode === 'transparent-webm') {
    return [
      '-y',
      '-i', input.inputPath,
      '-c:v', 'libvpx-vp9',
      '-pix_fmt', 'yuva420p',
      '-auto-alt-ref', '0',
      '-b:v', '0',
      '-crf', '30',
      '-metadata:s:v:0', 'alpha_mode=1',
      '-an',
      input.outputPath,
    ];
  }

  return [
    '-y',
    '-i', input.inputPath,
    '-c:v', 'prores_ks',
    '-profile:v', '4444',
    '-pix_fmt', 'yuva444p10le',
    '-an',
    input.outputPath,
  ];
}

export function createRawVideoFfmpegCommand(input: RawVideoFfmpegInput): string[] {
  const rawInput = [
    '-f', 'rawvideo',
    '-pix_fmt', 'rgba',
    '-s', `${input.width}x${input.height}`,
    '-r', String(input.fps),
    '-i', 'pipe:0',
  ];
  if (input.mode === 'full-video') {
    return [
      '-y',
      '-i', input.inputPath,
      ...rawInput,
      '-filter_complex', '[0:v][1:v]overlay=0:0:format=auto[v]',
      '-map', '[v]',
      '-map', '0:a?',
      '-t', String(input.durationSec),
      '-c:v', 'libx264',
      '-c:a', 'aac',
      input.outputPath,
    ];
  }
  if (input.mode === 'transparent-webm') {
    return [
      '-y',
      ...rawInput,
      '-t', String(input.durationSec),
      '-c:v', 'libvpx-vp9',
      '-pix_fmt', 'yuva420p',
      '-auto-alt-ref', '0',
      '-b:v', '0',
      '-crf', '30',
      '-metadata:s:v:0', 'alpha_mode=1',
      '-an',
      input.outputPath,
    ];
  }

  return [
    '-y',
    ...rawInput,
    '-t', String(input.durationSec),
    '-c:v', 'prores_ks',
    '-profile:v', '4444',
    '-pix_fmt', 'yuva444p10le',
    '-an',
    input.outputPath,
  ];
}
