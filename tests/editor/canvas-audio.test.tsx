import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CanvasStage } from '../../src/editor/canvas/CanvasStage';
import { createFixtureProject } from '../../src/project/fixtures';
import { createProjectStore } from '../../src/project/store';

describe('Canvas audio surface', () => {
  it('keeps imported video audio enabled by default', () => {
    render(
      <CanvasStage
        currentTime={0}
        onSelect={() => undefined}
        onVideoMetadata={() => undefined}
        onVideoTime={() => undefined}
        playing={false}
        project={createFixtureProject()}
        selectedEffectId="fx-ring"
        store={createProjectStore(createFixtureProject())}
        videoSrc="blob:fixture"
      />,
    );

    expect((screen.getByTestId('preview-video') as HTMLVideoElement).muted).toBe(false);
  });
});

