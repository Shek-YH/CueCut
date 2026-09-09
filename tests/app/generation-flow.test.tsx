import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../../src/app/App';
import { createFixtureProject } from '../../src/project/fixtures';

describe('video to Workspace generation flow', () => {
  it('uploads the imported video once and imports returned SRT and composition', async () => {
    const composition = createFixtureProject();
    composition.project.projectId = 'generated-project';
    composition.project.durationSec = 12;
    composition.project.canvasWidth = 1080;
    composition.project.canvasHeight = 1920;
    composition.project.aspectRatio = '9:16';
    composition.project.video.sourceFileName = 'portrait.mp4';
    composition.effects = [composition.effects[0]!];
    composition.effects[0]!.time = { startSec: 1, endSec: 4 };
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      if (input === '/api/probe-video') {
        return new Response(JSON.stringify({ durationSec: 12, fps: 30, width: 1080, height: 1920 }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      return new Response(JSON.stringify({
        transcript: [{ id: 's-real-1', startSec: 0, endSec: 2.5, text: 'ASR字幕' }],
        composition,
        warnings: [],
        usedFallback: false,
        asrRequestId: 'asr-1',
        asrDurationSec: 12,
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    });
    const video = new File(['video-bytes'], 'portrait.mp4', { type: 'video/mp4' });

    render(<App />);
    fireEvent.change(screen.getByTestId('video-input'), { target: { files: [video] } });

    const generateButton = screen.getByRole('button', { name: '开始生成动效' });
    await waitFor(() => expect(generateButton).toBeEnabled());
    expect(generateButton).toBeEnabled();
    fireEvent.click(generateButton);
    expect(screen.getByRole('button', { name: '生成中…' })).toBeDisabled();

    await waitFor(() => expect(screen.getByDisplayValue('ASR字幕')).toBeVisible());
    expect(screen.getAllByText('portrait.mp4')).not.toHaveLength(0);
    expect(screen.queryByTestId('effect-card-fx-quote')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '已生成并载入' })).toBeDisabled();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith('/api/generate-effects', expect.objectContaining({ body: video }));

    fetchMock.mockRestore();
  });
});
