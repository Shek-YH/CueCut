export type FfmpegExportInput =
  | { mode: 'full-video'; inputPath: string; renderFramesPath: string; outputPath: string }
  | { mode: 'transparent-mov'; inputPath: string; outputPath: string };

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

