import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createFixtureProject } from '../../src/project/fixtures';
import { createProjectStore } from '../../src/project/store';
import { Timeline } from '../../src/editor/timeline/Timeline';

describe('Timeline subtitle track', () => {
  it('shows compact subtitle clip labels instead of subtitle body text', () => {
    const project = createFixtureProject();
    project.subtitles = [{ id: 's-1', startSec: 1, endSec: 2, text: '这是一段很长的字幕正文' }];

    render(<Timeline project={project} store={createProjectStore(project)} currentTime={0} onSeek={() => undefined} />);

    expect(screen.getByText('字幕 1')).toBeInTheDocument();
    expect(screen.queryByText('这是一段很长的字幕正文')).not.toBeInTheDocument();
  });
});
