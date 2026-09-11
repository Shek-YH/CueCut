import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CanvasStage } from '../../src/editor/canvas/CanvasStage';
import { createFixtureProject } from '../../src/project/fixtures';
import { createProjectStore } from '../../src/project/store';

describe('Canvas video surface', () => {
  afterEach(() => vi.restoreAllMocks());

  it('reports native video time updates to the PlaybackClock boundary', () => {
    const onVideoTime = vi.fn();
    render(
      <CanvasStage
        currentTime={0}
        onSelect={() => undefined}
        onVideoTime={onVideoTime}
        playing={false}
        project={createFixtureProject()}
        selectedEffectId="fx-ring"
        store={createProjectStore(createFixtureProject())}
        videoSrc="blob:fixture"
      />,
    );

    const video = screen.getByTestId('preview-video');
    Object.defineProperty(video, 'currentTime', { configurable: true, value: 4.25 });
    fireEvent.timeUpdate(video);

    expect(onVideoTime).toHaveBeenCalledWith(4.25);
  });

  it('reports native metadata so the Project Store can update duration and aspect ratio', () => {
    const onVideoMetadata = vi.fn();
    render(
      <CanvasStage
        currentTime={0}
        onSelect={() => undefined}
        onVideoMetadata={onVideoMetadata}
        onVideoTime={() => undefined}
        playing={false}
        project={createFixtureProject()}
        selectedEffectId="fx-ring"
        store={createProjectStore(createFixtureProject())}
        videoSrc="blob:fixture"
      />,
    );

    const video = screen.getByTestId('preview-video');
    Object.defineProperties(video, {
      duration: { configurable: true, value: 42.5 },
      videoWidth: { configurable: true, value: 1080 },
      videoHeight: { configurable: true, value: 1920 },
    });
    fireEvent.loadedMetadata(video);

    expect(onVideoMetadata).toHaveBeenCalledWith({ durationSec: 42.5, canvasWidth: 1080, canvasHeight: 1920 });
  });

  it('seeks the native video while playback remains active', () => {
    const props = {
      onSelect: () => undefined,
      onVideoMetadata: () => undefined,
      onVideoTime: () => undefined,
      playing: true,
      project: createFixtureProject(),
      selectedEffectId: 'fx-ring',
      store: createProjectStore(createFixtureProject()),
      videoSrc: 'blob:fixture',
    };
    const { rerender } = render(<CanvasStage {...props} currentTime={0} />);
    const video = screen.getByTestId('preview-video');
    Object.defineProperty(video, 'currentTime', { configurable: true, writable: true, value: 1 });

    rerender(<CanvasStage {...props} currentTime={8} />);

    expect(video.currentTime).toBe(8);
  });

  it('seeks exactly to a paused target even when the old video time is within one debounce window', () => {
    const props = {
      onSelect: () => undefined,
      onVideoMetadata: () => undefined,
      onVideoTime: () => undefined,
      playing: false,
      project: createFixtureProject(),
      selectedEffectId: 'fx-quote',
      store: createProjectStore(createFixtureProject()),
      videoSrc: 'blob:fixture',
    };
    const { rerender } = render(<CanvasStage {...props} currentTime={2.30} />);
    const video = screen.getByTestId('preview-video');
    Object.defineProperty(video, 'currentTime', { configurable: true, writable: true, value: 2.30 });

    rerender(<CanvasStage {...props} currentTime={2.35} />);

    expect(video.currentTime).toBe(2.35);
  });

  it('reasserts a paused seek on the next animation frame after an old timeupdate overwrites it', () => {
    let frameCallback: FrameRequestCallback | undefined;
    const requestAnimationFrame = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frameCallback = callback;
      return 1;
    });
    const props = {
      onSelect: () => undefined,
      onVideoMetadata: () => undefined,
      onVideoTime: () => undefined,
      playing: false,
      project: createFixtureProject(),
      selectedEffectId: 'fx-quote',
      store: createProjectStore(createFixtureProject()),
      videoSrc: 'blob:fixture',
    };
    const { rerender } = render(<CanvasStage {...props} currentTime={2.30} />);
    const video = screen.getByTestId('preview-video');
    Object.defineProperty(video, 'currentTime', { configurable: true, writable: true, value: 2.30 });

    rerender(<CanvasStage {...props} currentTime={2.35} />);
    video.currentTime = 2.30;
    fireEvent.timeUpdate(video);
    frameCallback?.(0);

    expect(requestAnimationFrame).toHaveBeenCalled();
    expect(video.currentTime).toBe(2.35);
  });

  it('seeks the native video to the current frame when metadata arrives after a clock seek', () => {
    render(
      <CanvasStage
        currentTime={2.37}
        onSelect={() => undefined}
        onVideoMetadata={() => undefined}
        onVideoTime={() => undefined}
        playing={false}
        project={createFixtureProject()}
        selectedEffectId="fx-quote"
        store={createProjectStore(createFixtureProject())}
        videoSrc="blob:fixture"
      />,
    );

    const video = screen.getByTestId('preview-video');
    Object.defineProperties(video, {
      currentTime: { configurable: true, writable: true, value: 0 },
      readyState: { configurable: true, value: 0 },
      duration: { configurable: true, value: 30 },
      videoWidth: { configurable: true, value: 1920 },
      videoHeight: { configurable: true, value: 1080 },
    });

    fireEvent.loadedMetadata(video);

    expect(video.currentTime).toBe(2.37);
  });

  it('selects and seeks to a visible preview frame when an effect card is clicked without breaking drag', () => {
    const onSelect = vi.fn();
    const onVideoTime = vi.fn();
    render(
      <CanvasStage
        currentTime={0}
        onSelect={onSelect}
        onVideoMetadata={() => undefined}
        onVideoTime={onVideoTime}
        playing={false}
        project={createFixtureProject()}
        selectedEffectId="fx-ring"
        store={createProjectStore(createFixtureProject())}
        videoSrc={null}
      />,
    );

    const card = screen.getByTestId('effect-card-fx-quote');
    fireEvent.click(card);

    expect(onSelect).toHaveBeenCalledWith('fx-quote');
    expect(onVideoTime).toHaveBeenCalledWith(2.2 + 5 / 30);

    vi.clearAllMocks();
    const canvas = card.closest('.canvas');
    if (!canvas) throw new Error('Canvas fixture missing');
    Object.defineProperty(canvas, 'getBoundingClientRect', { configurable: true, value: () => ({ width: 100, height: 100 }) });
    Object.defineProperty(card, 'setPointerCapture', { configurable: true, value: vi.fn() });
    fireEvent.pointerDown(card, { clientX: 10, clientY: 10, pointerId: 1 });
    fireEvent.pointerMove(card, { clientX: 20, clientY: 10, pointerId: 1 });
    fireEvent.pointerUp(card, { clientX: 20, clientY: 10, pointerId: 1 });
    fireEvent.click(card);

    expect(onVideoTime).not.toHaveBeenCalled();
  });
});
