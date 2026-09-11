import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createFixtureProject } from '../../src/project/fixtures';
import { createProjectStore } from '../../src/project/store';
import { Timeline } from '../../src/editor/timeline/Timeline';

describe('Timeline effect selection', () => {
  it('selects and seeks to a visible preview frame when an effect clip is clicked', () => {
    const project = createFixtureProject();
    const onSelect = vi.fn();
    const onSeek = vi.fn();

    render(<Timeline project={project} store={createProjectStore(project)} currentTime={0} onSelect={onSelect} onSeek={onSeek} />);

    fireEvent.click(screen.getByLabelText('fx-quote effect clip'));

    expect(onSelect).toHaveBeenCalledWith('fx-quote');
    expect(onSeek).toHaveBeenCalledWith(2.2 + 5 / 30);
  });

  it('does not seek after dragging an effect clip', () => {
    const project = createFixtureProject();
    const onSelect = vi.fn();
    const onSeek = vi.fn();

    render(<Timeline project={project} store={createProjectStore(project)} currentTime={0} onSelect={onSelect} onSeek={onSeek} />);

    const clip = screen.getByLabelText('fx-quote effect clip');
    Object.defineProperty(clip, 'setPointerCapture', { configurable: true, value: vi.fn() });
    fireEvent.pointerDown(clip, { clientX: 10, clientY: 10, pointerId: 1 });
    fireEvent.pointerMove(clip, { clientX: 20, clientY: 10, pointerId: 1 });
    fireEvent.pointerUp(clip, { clientX: 20, clientY: 10, pointerId: 1 });
    fireEvent.click(clip);

    expect(onSelect).not.toHaveBeenCalled();
    expect(onSeek).not.toHaveBeenCalled();
  });
});
