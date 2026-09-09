import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../../src/app/App';

describe('global playback controls', () => {
  it('toggles playback when Space is pressed outside editable controls', () => {
    render(<App />);

    fireEvent.keyDown(document, { code: 'Space', key: ' ' });

    expect(screen.getByRole('button', { name: '❚❚ 暂停' })).toBeVisible();
  });

  it('does not steal Space while an editable control is focused', () => {
    render(<App />);
    const input = screen.getByTestId('video-input');

    input.focus();
    fireEvent.keyDown(input, { code: 'Space', key: ' ' });

    expect(screen.getByRole('button', { name: '▶ 播放' })).toBeVisible();
  });
});

