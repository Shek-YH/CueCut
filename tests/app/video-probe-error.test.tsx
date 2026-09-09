import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../../src/app/App';

describe('video probe failure handling', () => {
  it('shows the metadata error and keeps metadata-dependent actions disabled', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('probe unavailable'));
    const video = new File(['video'], 'video.mp4', { type: 'video/mp4' });

    render(<App />);
    fireEvent.change(screen.getByTestId('video-input'), { target: { files: [video] } });

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('视频元数据'));
    expect(screen.getByRole('button', { name: '开始生成动效' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '导出', exact: true })).toBeDisabled();
    fetchMock.mockRestore();
  });
});
