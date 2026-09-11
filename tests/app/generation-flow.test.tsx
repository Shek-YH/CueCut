import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../../src/app/App';
import { createFixtureProject } from '../../src/project/fixtures';

describe('video to Workspace generation flow', () => {
  it('exposes transparent WebM as an export mode', () => {
    render(<App />);
    expect(screen.getByRole('option', { name: 'WebM · 透明叠加' })).toBeInTheDocument();
  });

  it('keeps the video import control as a stable labelled file-picker trigger', () => {
    render(<App />);
    expect(screen.getByTestId('video-import-control')).toHaveAttribute('type', 'button');
    expect(screen.getByTestId('video-import-control')).toHaveTextContent('导入视频');
  });

  it('opens the hidden file input when the visible import button is clicked', () => {
    const inputClick = vi.spyOn(HTMLInputElement.prototype, 'click');
    render(<App />);

    fireEvent.click(screen.getByTestId('video-import-control'));

    expect(inputClick).toHaveBeenCalledTimes(1);
    inputClick.mockRestore();
  });

  it('exposes the dedicated Packaging AI generation action', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: '生成 AI 包装' })).toBeInTheDocument();
    expect(screen.getByText('包装密度')).toBeInTheDocument();
    expect(screen.getByLabelText('人物避让距离')).toBeInTheDocument();
  });

  it('transcribes an imported video before the independent Packaging AI call and loads both SRT and overlays', async () => {
    const calls: string[] = [];
    const plan = {
      schemaVersion: '1.0' as const,
      projectId: 'packaging-project',
      canvas: { width: 1920, height: 1080, aspectRatio: '16:9', fps: 30 },
      globalStyle: { visualStyle: 'clean-tech', energy: 0.5, density: 'auto' as const, paletteIntent: 'brand', motionIntensity: 0.5 },
      timeline: [{
        id: 'overlay-1', startSec: 1, endSec: 3, intent: 'highlight', category: 'stat' as const, content: { value: '67%', label: '增长' }, importance: 0.8,
        visualIntent: { style: 'clean-tech', energy: 0.5, emphasis: 'strong' as const },
        motionIntent: { entrance: 'scale_punch' as const, emphasis: 'scale_pulse' as const, exit: 'fade_out' as const },
        placementIntent: { preferredZones: ['upper-left' as const], subjectRelation: 'avoid' as const, anchor: 'scene-safe' as const },
        constraints: { maxLines: 2, mustRemainReadable: true, mayOverlapSubtitle: false },
      }],
      constraints: { maxConcurrentOverlays: 2, allowBehindSubject: false, subjectAvoidPadding: 0.1, edgeInsets: { top: 0.04, bottom: 0.08, left: 0.05, right: 0.05 } },
      exportHints: { formats: ['mp4' as const], transparent: false },
    };
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      calls.push(String(input));
      if (input === '/api/probe-video') return new Response(JSON.stringify({ durationSec: 12, fps: 30, width: 1920, height: 1080 }), { status: 200 });
      if (input === '/api/transcribe-video') return new Response(JSON.stringify({ transcript: [{ id: 's-1', startSec: 0, endSec: 2.5, text: 'ASR字幕' }], srtFileName: 'portrait-asr.srt' }), { status: 200 });
      if (input === '/api/generate-packaging') {
        const body = JSON.parse(String(init?.body));
        expect(body.analysis.transcript).toEqual([{ id: 's-1', startSec: 0, endSec: 2.5, text: 'ASR字幕' }]);
        expect(body.analysis.effectLibrary.length).toBeGreaterThan(0);
        return new Response(JSON.stringify({ plan, aiCallCount: 1 }), { status: 200 });
      }
      return new Response('{}', { status: 404 });
    });
    const video = new File(['video-bytes'], 'portrait.mp4', { type: 'video/mp4' });

    render(<App />);
    fireEvent.change(screen.getByTestId('video-input'), { target: { files: [video] } });
    const packagingButton = screen.getByRole('button', { name: '生成 AI 包装' });
    await waitFor(() => expect(packagingButton).toBeEnabled());
    fireEvent.click(packagingButton);

    await waitFor(() => expect(screen.getByDisplayValue('ASR字幕')).toBeVisible());
    expect(await screen.findByTestId('packaging-status')).toHaveTextContent('1 个已排版');
    expect(screen.getByTestId('effect-card-packaging-overlay-1')).toBeInTheDocument();
    expect(calls.indexOf('/api/transcribe-video')).toBeLessThan(calls.indexOf('/api/generate-packaging'));
    expect(calls.filter((call) => call === '/api/generate-packaging')).toHaveLength(1);

    fetchMock.mockRestore();
  });

  it('opens the global settings panel from the header', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '设置' }));
    expect(screen.getByRole('dialog', { name: '设置' })).toBeInTheDocument();
    expect(screen.getByLabelText('阿里百炼 API Key')).toHaveAttribute('type', 'password');
  });

  it('shows an HTTP export error when the server returns an empty error body', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      if (input === '/api/probe-video') return new Response(JSON.stringify({ durationSec: 2, fps: 30, width: 320, height: 180 }), { status: 200 });
      return new Response('', { status: 500 });
    });
    const video = new File(['video-bytes'], 'export.mp4', { type: 'video/mp4' });

    render(<App />);
    fireEvent.change(screen.getByTestId('video-input'), { target: { files: [video] } });
    const exportButton = screen.getByRole('button', { name: '导出' });
    await waitFor(() => expect(exportButton).toBeEnabled());
    fireEvent.click(exportButton);

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('导出失败（HTTP 500）'));
    expect(screen.getByRole('alert')).not.toHaveTextContent('Unexpected end of JSON input');

    fetchMock.mockRestore();
  });

  it('sends transparent export composition in the request body instead of an oversized header', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      if (input === '/api/probe-video') return new Response(JSON.stringify({ durationSec: 2, fps: 30, width: 320, height: 180 }), { status: 200 });
      return new Response('encoded', { status: 200, headers: { 'content-type': 'video/webm' } });
    });
    const video = new File(['video-bytes'], 'export.mp4', { type: 'video/mp4' });

    render(<App />);
    fireEvent.change(screen.getByTestId('video-input'), { target: { files: [video] } });
    await waitFor(() => expect(screen.getByRole('button', { name: '导出', exact: true })).toBeEnabled());
    fireEvent.change(screen.getByLabelText('导出模式'), { target: { value: 'transparent-webm' } });
    fireEvent.click(screen.getByRole('button', { name: '导出', exact: true }));

    await waitFor(() => expect(screen.getByTestId('export-status')).toHaveTextContent('已生成本地文件'));
    const exportCall = fetchMock.mock.calls.find(([input]) => input === '/api/export');
    expect(exportCall).toBeDefined();
    const init = exportCall?.[1] as RequestInit;
    expect((init.headers as Record<string, string>)['X-CueCut-Composition']).toBeUndefined();
    expect(init.body).toContain('composition');

    fetchMock.mockRestore();
  });

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
    expect(screen.queryByTestId('generation-fallback')).not.toBeInTheDocument();
    expect(screen.queryByTestId('selection-trace')).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith('/api/generate-effects', expect.objectContaining({ body: video }));

    fetchMock.mockRestore();
  });

  it('shows fallback state and the returned selection trace instead of ordinary success', async () => {
    const composition = createFixtureProject();
    composition.project.projectId = 'fallback-project';
    composition.project.durationSec = 12;
    composition.project.canvasWidth = 1080;
    composition.project.canvasHeight = 1920;
    composition.project.aspectRatio = '9:16';
    composition.project.video.sourceFileName = 'fallback.mp4';
    composition.effects = [composition.effects[0]!];
    composition.effects[0]!.time = { startSec: 1, endSec: 4 };
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      if (input === '/api/probe-video') {
        return new Response(JSON.stringify({ durationSec: 12, fps: 30, width: 1080, height: 1920 }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      return new Response(JSON.stringify({
        transcript: [{ id: 's-fallback-1', startSec: 0, endSec: 2.5, text: '回退字幕' }],
        composition,
        warnings: ['Director provider failed'],
        usedFallback: true,
        selectionTrace: [{
          visualUnitId: 'unit-process-1',
          semanticIntent: 'ordered_process',
          retrievedCandidates: ['steps:process-list', 'quote:hero'],
          selected: 'steps:process-list',
          dataContractPassed: true,
          durationContractPassed: true,
        }],
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    });
    const video = new File(['video-bytes'], 'fallback.mp4', { type: 'video/mp4' });

    render(<App />);
    fireEvent.change(screen.getByTestId('video-input'), { target: { files: [video] } });
    const generateButton = screen.getByRole('button', { name: '开始生成动效' });
    await waitFor(() => expect(generateButton).toBeEnabled());
    fireEvent.click(generateButton);

    await waitFor(() => expect(screen.getByTestId('generation-fallback')).toHaveTextContent('本地回退'));
    expect(screen.getByTestId('generation-status')).toHaveTextContent('非 Director 成功');
    expect(screen.getByTestId('generation-warnings')).toHaveTextContent('Director provider failed');
    expect(screen.getByTestId('selection-trace')).toHaveTextContent('unit-process-1');
    expect(screen.getByTestId('selection-trace')).toHaveTextContent('ordered_process');
    expect(screen.getByTestId('selection-trace')).toHaveTextContent('steps:process-list');
    expect(screen.getByRole('button', { name: '已载入（本地回退）' })).toBeDisabled();

    fetchMock.mockRestore();
  });
});
