import { describe, expect, it } from 'vitest';
import { parseFfprobeJson } from '../../src/media/videoProbe';

describe('ffprobe media metadata', () => {
  it.each([
    ['30/1', '30/1', 30],
    ['30000/1001', '30000/1001', 30000 / 1001],
    ['60000/1001', '60000/1001', 60000 / 1001],
    ['60/1', '60/1', 60],
  ])('parses %s as the real frame rate', (rFrameRate, avgFrameRate, fps) => {
    const metadata = parseFfprobeJson(JSON.stringify({
      format: { duration: '12.5' },
      streams: [{ codec_type: 'video', codec_name: 'h264', pix_fmt: 'yuv420p', width: 1920, height: 1080, r_frame_rate: rFrameRate, avg_frame_rate: avgFrameRate }, { codec_type: 'audio', codec_name: 'aac' }],
    }));

    expect(metadata).toMatchObject({ durationSec: 12.5, width: 1920, height: 1080, codec: 'h264', fps });
    expect(metadata.hasAudio).toBe(true);
    expect(metadata.isVfr).toBe(false);
  });

  it('marks variable frame rate when nominal and average rates differ', () => {
    const metadata = parseFfprobeJson(JSON.stringify({
      format: { duration: '3' },
      streams: [{ codec_type: 'video', codec_name: 'h264', pix_fmt: 'yuv420p', width: 1080, height: 1920, r_frame_rate: '60/1', avg_frame_rate: '30000/1001' }],
    }));

    expect(metadata.isVfr).toBe(true);
    expect(metadata.rFrameRate).toBe(60);
    expect(metadata.avgFrameRate).toBeCloseTo(30000 / 1001);
  });
});
