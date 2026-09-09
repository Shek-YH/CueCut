import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../../src/app/App';

describe('canonical media import', () => {
  it('starts a newly imported video with empty subtitle and effect collections', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ durationSec: 6, fps: 30, width: 320, height: 180 }), { status: 200 }));
    const video = new File(['video'], 'new-video.mp4', { type: 'video/mp4' });

    render(<App />);
    fireEvent.change(screen.getByTestId('video-input'), { target: { files: [video] } });

    await waitFor(() => expect(screen.getByTestId('canvas-stage')).toHaveTextContent('0 FX active'));
    expect(screen.queryByTestId('effect-card-fx-ring')).not.toBeInTheDocument();
    expect(screen.queryByText('字幕1')).not.toBeInTheDocument();
    fetchMock.mockRestore();
  });
});
