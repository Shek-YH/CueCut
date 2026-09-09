import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CanvasStage } from '../../src/editor/canvas/CanvasStage';
import { createFixtureProject } from '../../src/project/fixtures';
import { createProjectStore } from '../../src/project/store';

describe('Canvas video surface', () => {
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
});
