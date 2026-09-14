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

  it('blocks Packaging AI before transcription when the Director capability is not configured', async () => {
    const calls: string[] = [];
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      calls.push(String(input));
      if (input === '/api/probe-video') return new Response(JSON.stringify({ durationSec: 12, fps: 30, width: 1920, height: 1080 }), { status: 200 });
      if (input === '/api/runtime-capabilities') return new Response(JSON.stringify({ ok: true, director: { configured: false, verified: false, model: null, source: 'none' }, visualAssets: { mode: 'disabled', provider: 'disabled', model: null } }), { status: 200 });
      return new Response('{}', { status: 500 });
    });
    const video = new File(['video-bytes'], 'preflight.mp4', { type: 'video/mp4' });

    render(<App />);
    fireEvent.change(screen.getByTestId('video-input'), { target: { files: [video] } });
    const packagingButton = screen.getByRole('button', { name: '生成 AI 包装' });
    await waitFor(() => expect(packagingButton).toBeEnabled());
    fireEvent.click(packagingButton);

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('无法开始生成：请先配置阿里云百炼 API Key 和主模型。'));
    expect(calls).toContain('/api/runtime-capabilities');
    expect(calls).not.toContain('/api/transcribe-video');
    expect(calls).not.toContain('/api/generate-packaging');
    expect(packagingButton).toBeEnabled();
    fetchMock.mockRestore();
  });

  it('imports an external packaging bundle locally without calling an AI endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response('{}', { status: 500 }));
    const bundle = { schema: 'cuecut.packaging-bundle', version: 1, mode: 'project', composition: createFixtureProject(), assets: [] };
    const bundleFile = new File([JSON.stringify(bundle)], 'external-bundle.json', { type: 'application/json' });

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '载入包装 JSON' }));
    fireEvent.change(screen.getByTestId('packaging-bundle-input'), { target: { files: [bundleFile] } });

    await waitFor(() => expect(screen.getByTestId('external-bundle-status')).toHaveTextContent('已载入外部包装'));
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockRestore();
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
      if (input === '/api/runtime-capabilities') return new Response(JSON.stringify({ ok: true, director: { configured: true, verified: false, model: 'qwen3.8-flash', source: 'env' }, visualAssets: { mode: 'disabled', provider: 'disabled', model: null } }), { status: 200 });
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
    expect(screen.getByTestId('packaging-status')).toHaveTextContent('AI 1 次');
    expect(screen.getByTestId('packaging-workflow')).toHaveTextContent('配置检查 · 成功');
    expect(screen.getByTestId('packaging-workflow')).toHaveTextContent('视频读取 · 成功');
    expect(screen.getByTestId('packaging-workflow')).toHaveTextContent('视频 → 音频 · 成功');
    expect(screen.getByTestId('packaging-workflow')).toHaveTextContent('音频 → SRT · 成功');
    expect(screen.getByTestId('packaging-workflow')).toHaveTextContent('SRT → Director · 成功');
    expect(screen.getByTestId('packaging-workflow')).toHaveTextContent('本地 Resolve / Layout · 成功');
    expect(screen.getByTestId('packaging-workflow')).toHaveTextContent('Runtime 编译 · 成功');
    expect(screen.getByTestId('packaging-workflow')).toHaveTextContent('载入 Workspace · 成功');
    expect(calls.indexOf('/api/transcribe-video')).toBeLessThan(calls.indexOf('/api/generate-packaging'));
    expect(calls.filter((call) => call === '/api/generate-packaging')).toHaveLength(1);

    fetchMock.mockRestore();
  });

  it('marks the Director stage as failed when Packaging Director times out', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      if (input === '/api/probe-video') return new Response(JSON.stringify({ durationSec: 12, fps: 30, width: 1920, height: 1080 }), { status: 200 });
      if (input === '/api/runtime-capabilities') return new Response(JSON.stringify({ ok: true, director: { configured: true, verified: false, model: 'qwen3.8-flash', source: 'env' }, visualAssets: { mode: 'disabled', provider: 'disabled', model: null } }), { status: 200 });
      if (input === '/api/transcribe-video') return new Response(JSON.stringify({ transcript: [{ id: 's-1', startSec: 0, endSec: 2, text: '字幕' }], srtFileName: 'smoke-asr.srt' }), { status: 200 });
      if (input === '/api/generate-packaging') return new Response(JSON.stringify({ message: 'Bailian request timed out after 120000ms' }), { status: 500 });
      return new Response('{}', { status: 404 });
    });
    const video = new File(['video-bytes'], 'timeout.mp4', { type: 'video/mp4' });

    render(<App />);
    fireEvent.change(screen.getByTestId('video-input'), { target: { files: [video] } });
    const packagingButton = screen.getByRole('button', { name: '生成 AI 包装' });
    await waitFor(() => expect(packagingButton).toBeEnabled());
    fireEvent.click(packagingButton);

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Bailian request timed out after 120000ms'));
    expect(screen.getByTestId('packaging-workflow')).toHaveTextContent('SRT → Director · 失败');
    expect(screen.getByTestId('packaging-workflow')).toHaveTextContent('120000ms');
    expect(screen.getByTestId('packaging-workflow')).not.toHaveTextContent('Runtime 编译 · 成功');
    fetchMock.mockRestore();
  });

  it('calls the visual asset provider for raster-worthy plan assets and continues to Workspace', async () => {
    const calls: string[] = [];
    const plan = {
      schemaVersion: '1.0' as const,
      projectId: 'visual-asset-project',
      canvas: { width: 1920, height: 1080, aspectRatio: '16:9', fps: 30 },
      globalStyle: { visualStyle: 'clean-tech', energy: 0.5, density: 'auto' as const, paletteIntent: 'brand', motionIntensity: 0.5 },
      timeline: [{
        id: 'robot-overlay', startSec: 1, endSec: 4, intent: 'character', category: 'stat' as const, content: { value: '1', label: 'AI 助手', text: 'AI 助手', assetRequest: { needed: true, assetId: 'ai_robot_assistant', displayName: 'AI Robot Assistant', kind: 'character' as const, description: 'friendly futuristic AI robot assistant, isolated full body', semanticTags: ['ai', 'robot'], importance: 'hero' as const } }, importance: 0.9,
        visualIntent: { style: 'clean-tech', energy: 0.5, emphasis: 'strong' as const }, motionIntent: { entrance: 'slide_right' as const, emphasis: 'none' as const, exit: 'slide_out_right' as const }, placementIntent: { preferredZones: ['upper-right' as const], subjectRelation: 'avoid' as const, anchor: 'scene-safe' as const }, templateQuery: { semanticRole: 'evidence' as const, requiredContentSlots: ['value'], preferredZones: ['upper-right' as const] }, constraints: { maxLines: 2, mustRemainReadable: true, mayOverlapSubtitle: false },
      }],
      constraints: { maxConcurrentOverlays: 2, allowBehindSubject: true, subjectAvoidPadding: 0.1, edgeInsets: { top: 0.04, bottom: 0.08, left: 0.05, right: 0.05 } },
      exportHints: { formats: ['mp4' as const], transparent: false },
    };
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      calls.push(String(input));
      if (input === '/api/probe-video') return new Response(JSON.stringify({ durationSec: 12, fps: 30, width: 1920, height: 1080 }), { status: 200 });
      if (input === '/api/runtime-capabilities') return new Response(JSON.stringify({ ok: true, director: { configured: true, verified: false, model: 'qwen3.8-flash', source: 'env' }, visualAssets: { mode: 'ready', provider: 'openai-compatible', model: 'image-model' } }), { status: 200 });
      if (input === '/api/transcribe-video') return new Response(JSON.stringify({ transcript: [{ id: 's-1', startSec: 0, endSec: 2, text: 'AI 助手' }], srtFileName: 'visual-asr.srt' }), { status: 200 });
      if (input === '/api/generate-packaging') return new Response(JSON.stringify({ plan, aiCallCount: 1 }), { status: 200 });
      if (input === '/api/generate-visual-assets') {
        const body = JSON.parse(String(init?.body)) as { atlasPlans?: Array<{ slots?: Array<{ assetId: string }> }> };
        expect(body.atlasPlans?.[0]?.slots?.[0]?.assetId).toBe('ai_robot_assistant');
        return new Response(JSON.stringify({ ok: true, status: 'generated', assets: [{ assetId: 'ai_robot_assistant', page: 0, imageBase64: 'generated-png' }] }), { status: 200 });
      }
      return new Response('{}', { status: 404 });
    });
    const video = new File(['video-bytes'], 'visual.mp4', { type: 'video/mp4' });

    render(<App />);
    fireEvent.change(screen.getByTestId('video-input'), { target: { files: [video] } });
    const packagingButton = screen.getByRole('button', { name: '生成 AI 包装' });
    await waitFor(() => expect(packagingButton).toBeEnabled());
    fireEvent.click(packagingButton);

    await waitFor(() => expect(screen.getByTestId('packaging-status')).toHaveTextContent('已生成包装计划'));
    expect(calls.indexOf('/api/generate-packaging')).toBeLessThan(calls.indexOf('/api/generate-visual-assets'));
    expect(screen.getByTestId('packaging-workflow')).toHaveTextContent('视觉资产生成 · 成功');
    expect(screen.getByTestId('packaging-workflow')).toHaveTextContent('Runtime 编译 · 成功');
    fetchMock.mockRestore();
  });

  it('opens the global settings panel from the header', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '设置' }));
    expect(screen.getByRole('dialog', { name: '设置' })).toBeInTheDocument();
    expect(screen.getByLabelText('阿里百炼 API Key')).toHaveAttribute('type', 'password');
  });

  it('loads and persists visual asset provider settings without retaining the API key in the form', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      if (input === '/api/settings' && !init) {
        return new Response(JSON.stringify({ ok: true, bailianApiKeyConfigured: true, visualAssetApiKeyConfigured: false, visualAssetProvider: 'openai-compatible', visualAssetEndpoint: 'https://images.example.test/v1', visualAssetModel: 'qwen3.8-flash', visualAssetDefaultStyle: 'tech_neon_3d', visualAssetMaxAssets: 8, referenceImageConditioning: 'auto' }), { status: 200 });
      }
      if (input === '/api/settings' && init?.method === 'POST') {
        const body = JSON.parse(String(init.body)) as Record<string, unknown>;
        expect(body).toMatchObject({ visualAssetApiKey: 'visual-secret', visualAssetProvider: 'openai-compatible', visualAssetEndpoint: 'https://images.example.test/v1', visualAssetModel: 'qwen3.8-flash', visualAssetMaxAssets: 8 });
        return new Response(JSON.stringify({ ok: true, bailianApiKeyConfigured: true, visualAssetApiKeyConfigured: true, visualAssetProvider: 'openai-compatible', visualAssetEndpoint: body.visualAssetEndpoint, visualAssetModel: body.visualAssetModel, visualAssetDefaultStyle: body.visualAssetDefaultStyle, visualAssetMaxAssets: body.visualAssetMaxAssets, referenceImageConditioning: body.referenceImageConditioning }), { status: 200 });
      }
      return new Response('{}', { status: 404 });
    });

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '设置' }));
    await waitFor(() => expect(screen.getByDisplayValue('qwen3.8-flash')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('视觉资产 API Key'), { target: { value: 'visual-secret' } });
    fireEvent.click(screen.getByRole('button', { name: '保存视觉资产设置' }));

    await waitFor(() => expect(screen.getByLabelText('视觉资产 API Key')).toHaveValue(''));
    expect(screen.getByText('视觉资产 API Key · 已配置')).toBeInTheDocument();
    fetchMock.mockRestore();
  });

  it('does not clear the other settings draft and shows scoped save errors', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      if (input === '/api/settings' && !init) {
        return new Response(JSON.stringify({ ok: true, bailianApiKeyConfigured: false, visualAssetApiKeyConfigured: false, visualAssetProvider: 'disabled', visualAssetEndpoint: '', visualAssetModel: '', visualAssetDefaultStyle: 'tech_neon_3d', visualAssetMaxAssets: 12, referenceImageConditioning: 'auto' }), { status: 200 });
      }
      if (input === '/api/settings' && init?.method === 'POST') {
        const body = JSON.parse(String(init.body)) as Record<string, unknown>;
        if (body.visualAssetProvider) {
          expect(body).not.toHaveProperty('apiKey');
          return new Response(JSON.stringify({ ok: true, bailianApiKeyConfigured: false, visualAssetApiKeyConfigured: true, visualAssetProvider: body.visualAssetProvider, visualAssetEndpoint: body.visualAssetEndpoint, visualAssetModel: body.visualAssetModel, visualAssetDefaultStyle: body.visualAssetDefaultStyle, visualAssetMaxAssets: body.visualAssetMaxAssets, referenceImageConditioning: body.referenceImageConditioning }), { status: 200 });
        }
        expect(body).not.toHaveProperty('visualAssetApiKey');
        return new Response(JSON.stringify({ ok: false, message: '保存失败：Key 无效' }), { status: 500 });
      }
      return new Response('{}', { status: 404 });
    });

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '设置' }));
    await waitFor(() => expect(screen.getByLabelText('视觉资产模型')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('阿里百炼 API Key'), { target: { value: 'bailian-draft' } });
    fireEvent.change(screen.getByLabelText('视觉资产 API Key'), { target: { value: 'visual-secret' } });
    fireEvent.click(screen.getByRole('button', { name: '保存视觉资产设置' }));

    await waitFor(() => expect(screen.getByLabelText('视觉资产 API Key')).toHaveValue(''));
    expect(screen.getByLabelText('阿里百炼 API Key')).toHaveValue('bailian-draft');
    expect(screen.getByTestId('visual-settings-status')).toHaveTextContent('保存成功');

    fireEvent.click(screen.getByRole('button', { name: '保存 API Key' }));
    await waitFor(() => expect(screen.getByTestId('bailian-settings-status')).toHaveTextContent('保存失败：Key 无效'));
    expect(screen.getByLabelText('阿里百炼 API Key')).toHaveValue('bailian-draft');
    fetchMock.mockRestore();
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
