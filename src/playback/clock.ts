export interface PlaybackClockSnapshot {
  currentTime: number;
  playing: boolean;
  frame: number;
}

export interface PlaybackClock {
  getSnapshot(): PlaybackClockSnapshot;
  subscribe(listener: () => void): () => void;
  setTime(timeSec: number): void;
  setDuration(durationSec: number, fps?: number): void;
  play(): void;
  pause(): void;
  toggle(): void;
  advance(deltaSec: number): void;
}

export function createPlaybackClock(options: { durationSec: number; fps: number; initialTime?: number }): PlaybackClock {
  const initialTime = Math.max(0, Math.min(options.durationSec, options.initialTime ?? 0));
  let snapshot: PlaybackClockSnapshot = { currentTime: initialTime, playing: false, frame: Math.round(initialTime * options.fps) };
  const listeners = new Set<() => void>();

  const notify = () => listeners.forEach((listener) => listener());
  const setTime = (timeSec: number) => {
    const currentTime = Math.max(0, Math.min(options.durationSec, timeSec));
    snapshot = { ...snapshot, currentTime, frame: Math.round(currentTime * options.fps) };
    notify();
  };
  const setDuration = (durationSec: number, fps?: number) => {
    options.durationSec = Math.max(0.1, durationSec);
    if (fps !== undefined) options.fps = fps;
    setTime(snapshot.currentTime);
  };

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setTime,
    setDuration,
    play: () => {
      snapshot = { ...snapshot, playing: true };
      notify();
    },
    pause: () => {
      snapshot = { ...snapshot, playing: false };
      notify();
    },
    toggle: () => {
      snapshot = { ...snapshot, playing: !snapshot.playing };
      notify();
    },
    advance: (deltaSec) => {
      if (!snapshot.playing) return;
      setTime(snapshot.currentTime + Math.max(0, deltaSec));
    },
  };
}
