import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../../src/app/App';

describe('export cancellation control', () => {
  it('aborts an in-flight export request from the UI', async () => {
    let signal: AbortSignal | undefined;
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      if (input === '/api/probe-video') return new Response(JSON.stringify({ durationSec: 6, fps: 30, width: 320, height: 180 }), { status: 200 });
      signal = init?.signal ?? undefined;
      return new Promise<Response>((_resolve, reject) => {
        signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
      });
    });
    const video = new File(['video'], 'video.mp4', { type: 'video/mp4' });

    render(<App />);
    fireEvent.change(screen.getByTestId('video-input'), { target: { files: [video] } });
    await waitFor(() => expect(screen.getByRole('button', { name: '导出', exact: true })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: '导出', exact: true }));
    await waitFor(() => expect(screen.getByRole('button', { name: '取消导出', exact: true })).toBeVisible());
    fireEvent.click(screen.getByRole('button', { name: '取消导出', exact: true }));

    expect(signal?.aborted).toBe(true);
    await waitFor(() => expect(screen.getByRole('button', { name: '导出', exact: true })).toBeEnabled());
    fetchMock.mockRestore();
  });
});
