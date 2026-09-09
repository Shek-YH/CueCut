/// <reference types="node" />
import { spawn } from 'node:child_process';

export interface VideoMetadata {
  durationSec: number;
  width: number;
  height: number;
  codec: string;
  pixelFormat: string;
  rFrameRate: number;
  avgFrameRate: number;
  fps: number;
  hasAudio: boolean;
  isVfr: boolean;
}

interface FfprobePayload {
  format?: { duration?: string | number };
  streams?: Array<{
    codec_type?: string;
    codec_name?: string;
    width?: number;
    height?: number;
    r_frame_rate?: string;
    avg_frame_rate?: string;
    pix_fmt?: string;
  }>;
}

function parseRate(value: string | undefined): number {
  if (!value) return 0;
  const [numerator, denominator] = value.split('/').map(Number);
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return 0;
  return numerator / denominator;
}

export function parseFfprobeJson(json: string): VideoMetadata {
  const payload = JSON.parse(json) as FfprobePayload;
  const video = payload.streams?.find((stream) => stream.codec_type === 'video');
  const durationSec = Number(payload.format?.duration);
  const width = Number(video?.width);
  const height = Number(video?.height);
  const rFrameRate = parseRate(video?.r_frame_rate);
  const avgFrameRate = parseRate(video?.avg_frame_rate) || rFrameRate;
  if (!Number.isFinite(durationSec) || durationSec <= 0 || !Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0 || !video?.codec_name || !video.pix_fmt || rFrameRate <= 0 || avgFrameRate <= 0) {
    throw new Error('FFprobe did not return usable video metadata');
  }
  return {
    durationSec,
    width,
    height,
    codec: video.codec_name,
    pixelFormat: video.pix_fmt,
    rFrameRate,
    avgFrameRate,
    fps: avgFrameRate,
    hasAudio: Boolean(payload.streams?.some((stream) => stream.codec_type === 'audio')),
    isVfr: Math.abs(rFrameRate - avgFrameRate) > 0.001,
  };
}

export async function probeVideoFile(videoPath: string, ffprobePath = 'ffprobe'): Promise<VideoMetadata> {
  const output = await new Promise<string>((resolve, reject) => {
    const child = spawn(ffprobePath, [
      '-v', 'error',
      '-show_entries', 'format=duration:stream=codec_type,codec_name,width,height,r_frame_rate,avg_frame_rate,pix_fmt',
      '-of', 'json',
      videoPath,
    ], { windowsHide: true });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? resolve(stdout) : reject(new Error(`${ffprobePath} failed with exit code ${code}: ${stderr.slice(-500)}`)));
  });
  return parseFfprobeJson(output);
}
