import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RealtimeCapturePanel } from '../../src/editor/realtime/RealtimeCapturePanel';

describe('RealtimeCapturePanel', () => {
  it('keeps the experimental entry hidden when the feature flag is off', () => {
    render(<RealtimeCapturePanel enabled={false} state="IDLE" result={null} error={null} onStart={vi.fn()} onCancel={vi.fn()} onDownload={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /极速抠像/ })).toBeNull();
  });

  it('exposes capture metrics and download only for an enabled valid result', () => {
    const onDownload = vi.fn();
    render(<RealtimeCapturePanel enabled state="SUCCESS" result={{
      fileName: 'fixture.webm', mimeType: 'video/webm;codecs=vp9', health: { actualFps: 30, droppedFrames: 0, maxDriftMs: 4, wallClockMs: 1000 }, validation: { ok: true, errors: [] },
    }} error={null} onStart={vi.fn()} onCancel={vi.fn()} onDownload={onDownload} />);
    expect(screen.getByText(/Capture FPS: 30/)).toBeInTheDocument();
    expect(screen.getByText(/Dropped Frames: 0/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /下载 fixture.webm/ })).toBeInTheDocument();
  });
});
