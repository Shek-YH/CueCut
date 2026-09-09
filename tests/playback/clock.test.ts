import { describe, expect, it } from 'vitest';
import { createPlaybackClock } from '../../src/playback/clock';

describe('PlaybackClock', () => {
  it('clamps time to the project duration and reports frame time', () => {
    const clock = createPlaybackClock({ durationSec: 30, fps: 30 });

    clock.setTime(31);
    expect(clock.getSnapshot()).toEqual({ currentTime: 30, playing: false, frame: 900 });

    clock.setTime(-2);
    expect(clock.getSnapshot()).toEqual({ currentTime: 0, playing: false, frame: 0 });
  });

  it('advances playback without changing project effect timing', () => {
    const clock = createPlaybackClock({ durationSec: 30, fps: 30 });

    clock.play();
    clock.advance(0.5);

    expect(clock.getSnapshot().currentTime).toBe(0.5);
    expect(clock.getSnapshot().playing).toBe(true);
  });

  it('can start at the prototype preview time without starting playback', () => {
    const clock = createPlaybackClock({ durationSec: 30, fps: 30, initialTime: 6.6 });

    expect(clock.getSnapshot()).toEqual({ currentTime: 6.6, playing: false, frame: 198 });
  });

  it('updates its duration when a real video metadata record is imported', () => {
    const clock = createPlaybackClock({ durationSec: 30, fps: 30 });

    clock.setDuration(222.1);
    clock.setTime(100);

    expect(clock.getSnapshot().currentTime).toBe(100);
  });
});
