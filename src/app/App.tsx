import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { EffectInstance, ProjectComposition } from '../project/schema';
import type { PackagingPlan } from '../packaging-ir/schema';
import { resolvePackagingPlan } from '../packaging/resolve';
import { applyResolvedPackagingToProject } from '../packaging/apply';
import { createFixtureProject } from '../project/fixtures';
import { createProjectStore, type ProjectStore } from '../project/store';
import { createPlaybackClock } from '../playback/clock';
import { createVideoSourceManager } from '../media/video';
import { CanvasStage } from '../editor/canvas/CanvasStage';
import { Inspector } from '../editor/inspector/Inspector';
import { LayersPanel } from '../editor/layers/LayersPanel';
import { SrtQuickPanel } from '../editor/subtitles/SrtQuickPanel';
import { Timeline } from '../editor/timeline/Timeline';
import { SfxLibrary } from '../editor/sfx/SfxLibrary';
import type { TranscriptSegment } from '../subtitles/srt';
import { createPreferenceEngine } from '../preferences/engine';
import { createPreferenceProfile } from '../preferences/profile';
import { createProjectPersistence } from '../project/persistence';
import { effectRegistry } from '../effects/registry';
import { findMotion, motionRegistry } from '../motions/registry';
import { evaluateMotion } from '../motions/runtime';
import { evaluateSceneAtTime } from '../render/scene';
import { createEffectRenderSpec, renderSpecSignature } from '../render/effectRenderSpec';
import { updateEffectDraftMotion } from '../runtime/draft';
import { compileProjectToRuntime } from '../runtime/compiler';
import { validateVisualGrounding } from '../director/grounding';
import { planVisualAssets } from '../visual-assets/planner';
import { validateResolvedPackagingPlan } from '../packaging/validateResolved';
import type { SelectionTraceEntry } from '../director/types';
import { createBrowserCanvasCaptureBackend } from '../export/realtime/browserCanvasBackend';
import { createRealtimeCaptureController } from '../export/realtime/controller';
import { createRealtimeCaptureDownload } from '../export/realtime/finalizer';
import { isRealtimeChromaCaptureEnabled } from '../export/realtime/featureFlag';
import type { CaptureState, RealtimeCaptureResult } from '../export/realtime/types';
import { RealtimeCapturePanel } from '../editor/realtime/RealtimeCapturePanel';
import { previewTimeForEffect } from '../editor/selection/previewTime';
import { createInitialBrowserPlaybackState, type BrowserPlaybackState } from '../media/videoPlayback';
import { importExternalBundle } from '../import/externalBundle';
import { buildAtlasPrompt, planAtlasPages } from '../visual-assets';

type ViewId = 'edit' | 'lab' | 'sfx' | 'learn';

type GenerationDiagnostics = {
  usedFallback: boolean;
  warnings: string[];
  selectionTrace: SelectionTraceEntry[];
};

type PackagingWorkflowStepId = 'preflight' | 'video-read' | 'video-audio' | 'audio-srt' | 'director' | 'asset-plan' | 'visual-generation' | 'resolve-layout' | 'runtime' | 'workspace';
type PackagingWorkflowStep = { id: PackagingWorkflowStepId; label: string; status: 'pending' | 'running' | 'success' | 'failed'; detail?: string };

const packagingWorkflowTemplate: Array<Pick<PackagingWorkflowStep, 'id' | 'label'>> = [
  { id: 'preflight', label: '配置检查' },
  { id: 'video-read', label: '视频读取' },
  { id: 'video-audio', label: '视频 → 音频' },
  { id: 'audio-srt', label: '音频 → SRT' },
  { id: 'director', label: 'SRT → Director' },
  { id: 'asset-plan', label: '视觉资产规划' },
  { id: 'visual-generation', label: '视觉资产生成' },
  { id: 'resolve-layout', label: '本地 Resolve / Layout' },
  { id: 'runtime', label: 'Runtime 编译' },
  { id: 'workspace', label: '载入 Workspace' },
];

function createPackagingWorkflow(): PackagingWorkflowStep[] {
  return packagingWorkflowTemplate.map((step) => ({ ...step, status: 'pending' }));
}

function assetRequestId(content: Record<string, unknown>): string | undefined {
  const request = content.assetRequest;
  if (!request || typeof request !== 'object' || Array.isArray(request)) return undefined;
  const assetId = (request as Record<string, unknown>).assetId;
  return typeof assetId === 'string' && assetId.length > 0 ? assetId : undefined;
}

const navItems: Array<{ id: ViewId; icon: string; label: string }> = [
  { id: 'edit', icon: '✦', label: '编辑' },
  { id: 'lab', icon: '◫', label: '动效库' },
  { id: 'sfx', icon: '♫', label: '音效库' },
  { id: 'learn', icon: '⌁', label: '自进化' },
];

function useStoreSnapshot(store: ProjectStore) {
  const subscribe = useMemo(() => store.subscribe.bind(store), [store]);
  const getSnapshot = useMemo(() => store.getSnapshot.bind(store), [store]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

function useClockSnapshot(clock: ReturnType<typeof createPlaybackClock>) {
  const subscribe = useMemo(() => clock.subscribe.bind(clock), [clock]);
  const getSnapshot = useMemo(() => clock.getSnapshot.bind(clock), [clock]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

function labelForEffect(effect: EffectInstance): string {
  if (effect.familyId === 'numeric') return '指标环 ' + effect.variantId.replace('ring-', '').toUpperCase();
  if (effect.familyId === 'quote') return '金句卡 ' + effect.variantId.replace('quote-', '').toUpperCase();
  if (effect.familyId === 'comparison') return '对比卡 ' + effect.variantId.replace('compare-', '').toUpperCase();
  return findMotion(effect.variantId)?.displayName ?? effect.familyId;
}

function EditView({
  project,
  store,
  currentTime,
  selectedEffectId,
  videoSrc,
  playing,
  onSelect,
  onSeek,
  subtitleItems,
  onSubtitleItemsChange,
  subtitleSettings,
  onSubtitleSettingsChange,
  onVideoMetadata,
  onVideoPlaybackState,
  onVideoPlaybackError,
  onOpenLab,
}: {
  project: ReturnType<typeof createFixtureProject>;
  store: ProjectStore;
  currentTime: number;
  selectedEffectId: string;
  videoSrc: string | null;
  playing: boolean;
  onSelect: (effectId: string) => void;
  onSeek: (timeSec: number) => void;
  subtitleItems?: TranscriptSegment[];
  onSubtitleItemsChange: (items: TranscriptSegment[]) => void;
  subtitleSettings?: ProjectComposition['subtitleSettings'];
  onSubtitleSettingsChange: (update: Partial<NonNullable<ProjectComposition['subtitleSettings']>>) => void;
  onVideoMetadata: (metadata: { durationSec: number; canvasWidth: number; canvasHeight: number }) => void;
  onVideoPlaybackState?: (state: BrowserPlaybackState) => void;
  onVideoPlaybackError?: (message: string) => void;
  onOpenLab: () => void;
}) {
  const handleLayerSelect = (effectId: string) => {
    onSelect(effectId);
    const effect = project.effects.find((item) => item.effectId === effectId);
    if (effect) onSeek(previewTimeForEffect({ ...effect.time, fps: project.project.fps }));
  };

  return (
    <div className="view edit active" data-testid="edit-view">
      <aside className="panel side edit-left">
        <div className="phead">
          <strong>编辑</strong>
          <span className="tiny">LAYERS + SRT</span>
        </div>
        <div className="editgrid">
        <LayersPanel project={project} selectedEffectId={selectedEffectId} onSelect={handleLayerSelect} />
          <SrtQuickPanel currentTime={currentTime} onSeek={onSeek} items={subtitleItems} onItemsChange={onSubtitleItemsChange} onSubtitleSettingsChange={onSubtitleSettingsChange} subtitleSettings={subtitleSettings} />
        </div>
      </aside>
      <CanvasStage
        project={project}
        currentTime={currentTime}
        selectedEffectId={selectedEffectId}
        videoSrc={videoSrc}
        store={store}
        playing={playing}
        onVideoTime={onSeek}
        onVideoMetadata={onVideoMetadata}
        onVideoPlaybackState={onVideoPlaybackState}
        onVideoPlaybackError={onVideoPlaybackError}
        onSelect={onSelect}
      />
      <Inspector
        project={project}
        selectedEffectId={selectedEffectId}
        store={store}
        onOpenLab={onOpenLab}
      />
    </div>
  );
}

function EffectLabView({
  project,
  store,
  selectedEffectId,
  onClose,
}: {
  project: ReturnType<typeof createFixtureProject>;
  store: ProjectStore;
  selectedEffectId: string;
  onClose: () => void;
}) {
  const source = project.effects.find((effect) => effect.effectId === selectedEffectId) ?? project.effects[0];
  const initialDraft = useMemo(() => (source ? store.cloneEffectDraft(source.effectId) : null), [source, store]);
  const [draft, setDraft] = useState<EffectInstance | null>(initialDraft);
  const [previewMode, setPreviewMode] = useState<'full' | 'enter' | 'exit'>('full');
  const [replayKey, setReplayKey] = useState(0);

  useEffect(() => {
    setDraft(initialDraft);
    setPreviewMode('full');
  }, [initialDraft]);

  if (!source || !draft) return null;

  const setEnter = (motionId: string) =>
    setDraft((current) => current ? updateEffectDraftMotion(current, 'enter', { motionId }) : current);
  const setExit = (motionId: string) =>
    setDraft((current) => current ? updateEffectDraftMotion(current, 'exit', { motionId }) : current);
  const setColor = (accent: string) =>
    setDraft((current) => (current ? { ...current, appearance: { ...current.appearance, accent } } : current));
  const setSfx = (sfxId: string) =>
    setDraft((current) =>
      current
        ? {
            ...current,
            sfx: sfxId === 'none' ? null : { sfxId, offsetSec: 0.06, gain: 0.7 },
          }
        : current,
    );

  const apply = () => {
    store.applyEffectDraft(draft);
    onClose();
  };

  const reset = () => {
    setDraft(store.cloneEffectDraft(source.effectId));
    setPreviewMode('full');
    setReplayKey((key) => key + 1);
  };

  const sameFamilyVariants = effectRegistry.filter((effect) => effect.familyId === source.familyId);
  const installedPackVariants = effectRegistry.filter((effect) => effect.sourceRef?.provider.startsWith('CueCut2_'));
  const enterMotions = motionRegistry.filter((motion) => motion.role === 'both' || motion.role === 'enter');
  const exitMotions = motionRegistry.filter((motion) => motion.role === 'both' || motion.role === 'exit');
  const previewRole = previewMode === 'exit' ? 'exit' : 'enter';
  const previewMotion = draft.motion[previewRole];
  const previewFrame = evaluateMotion(previewMotion.motionId, previewRole, previewMode === 'full' ? 0.72 : 0.5);
  const previewTransform = `translate(${previewFrame.translateX}px, ${previewFrame.translateY}px) scale(${previewFrame.scale}) rotate(${previewFrame.rotationDeg}deg)`;
  const previewProject = { ...project, effects: project.effects.map((effect) => effect.effectId === draft.effectId ? draft : effect) };
  const previewTime = previewMode === 'exit'
    ? Math.max(draft.time.startSec, draft.time.endSec - draft.motion.exit.durationSec / 2)
    : draft.time.startSec + Math.min(draft.motion.enter.durationSec / 2, (draft.time.endSec - draft.time.startSec) / 2);
  const previewItem = evaluateSceneAtTime(previewProject, previewTime).items.find((item) => item.effectId === draft.effectId);
  const previewSpec = previewItem ? createEffectRenderSpec(previewItem) : null;
  const previewItemTransform = previewItem ? `translate(${previewItem.translate.x}px, ${previewItem.translate.y}px) scale(${previewItem.scale}) rotate(${previewItem.rotation}deg)` : previewTransform;
  const contentForVariant = (variant: (typeof effectRegistry)[number], current: EffectInstance['content']): EffectInstance['content'] => {
    if (variant.contentSlots.includes('items')) return { items: ['First step', '第二步'] };
    if (variant.contentSlots.includes('value')) return { label: variant.displayName, value: '92.4', maximum: '100' };
    if (variant.contentSlots.includes('headline')) return { headline: variant.displayName };
    return current;
  };
  const selectVariant = (variant: (typeof effectRegistry)[number]) => setDraft((current) => current ? { ...current, familyId: variant.familyId, variantId: variant.variantId, content: variant.familyId === source.familyId ? current.content : contentForVariant(variant, current.content) } : current);

  return (
    <div className="view lab active" data-testid="effect-lab">
      <aside className="labcol">
        <div className="phead">
          <strong>模板与 Variant</strong>
          <span className="tiny">CURRENT CONTENT</span>
        </div>
        <div className="labbody">
          <div className="aiChoice">
            <b>◆ AI 当前方案</b>
            <p>
              {labelForEffect(source)} · {source.motion.enter.motionId} · {source.motion.exit.motionId}
              <br />
              内容、时间、坐标已从 Workspace 传入。
            </p>
          </div>
          <input className="search" placeholder="搜索同类动效…" />
          <div className="family" data-testid="registry-family">
            <div className="familytop">
              <div className="thumb ring" />
              <div>
                <div className="f-title">{source.familyId} Family</div>
                <div className="f-meta">Registry · {sameFamilyVariants.length} variants</div>
              </div>
            </div>
            <div className="variants">
              {sameFamilyVariants.map((variant) => (
                <button
                  className={'vbtn' + (draft.variantId === variant.variantId ? ' on' : '')}
                  data-testid={'registry-variant-' + variant.variantId}
                  key={`${variant.familyId}:${variant.variantId}`}
                  onClick={() => selectVariant(variant)}
                  type="button"
                >
                  {variant.familyId === source.familyId ? variant.variantId.split('-').at(-1)?.toUpperCase() ?? variant.displayName : variant.displayName}
                </button>
              ))}
            </div>
          </div>
          <div className="family" data-testid="registry-effect-library">
            <div className="familytop">
              <div className="thumb quote" />
              <div>
                <div className="f-title">正式动效库</div>
                <div className="f-meta">六套本地 Pack · lazy button preview</div>
              </div>
            </div>
            <div className="variants">
              {installedPackVariants.map((variant) => (
                <button
                  className={'vbtn' + (draft.variantId === variant.variantId ? ' on' : '')}
                  data-testid={'registry-effect-' + variant.variantId}
                  key={`${variant.familyId}:${variant.variantId}`}
                  onClick={() => selectVariant(variant)}
                  type="button"
                >
                  {variant.displayName}
                </button>
              ))}
            </div>
          </div>
          <div className="summary">Preview Draft 独立于主 Project。<br />只有点击「应用」才会产生一次 Undo Transaction。</div>
        </div>
      </aside>

      <main className="previewStage">
        <div className="previewTop">
          <strong>实时预览 · 使用当前真实内容</strong>
          <span className="director">AI 初始选择</span>
          <span className="spacer" />
          <button className="btn" onClick={() => { setPreviewMode('full'); setReplayKey((key) => key + 1); }} type="button">↻ 重播</button>
          <button className="btn" onClick={() => { setPreviewMode('enter'); setReplayKey((key) => key + 1); }} type="button">只看入场</button>
          <button className="btn" onClick={() => { setPreviewMode('exit'); setReplayKey((key) => key + 1); }} type="button">只看出场</button>
        </div>
        <div className="previewArea">
          <div className={'previewCanvas preview-' + previewMode} key={replayKey}>
            <div className="previewPerson" />
            <span className="draftBadge">PREVIEW DRAFT · 不影响主项目</span>
            <div className="previewCard" data-render-signature={previewSpec ? renderSpecSignature(previewSpec) : undefined} data-renderer-id={previewSpec?.rendererId} data-testid="preview-content" style={{ opacity: previewItem?.opacity ?? previewFrame.opacity, transform: previewItemTransform, filter: previewItem?.blur ? `blur(${previewItem.blur}px)` : undefined }}>
              {previewItem?.content.kind === 'number' ? (
                <>
                  <div className="previewRing" data-testid="preview-ring" style={{ borderColor: draft.appearance.accent, borderLeftColor: '#364154' }}>{String(previewItem.content.value)}</div>
                  <div className="previewCopy"><b>{previewItem.content.label}</b><span>Registry number content</span></div>
                </>
              ) : previewItem?.content.kind === 'list' ? (
                <div className="previewCopy"><b>List / Steps</b><span>{previewItem.content.items.join(' · ')}</span></div>
              ) : previewItem?.content.kind === 'text' ? (
                <div className="previewCopy"><b>{previewItem.content.text}</b><span>{draft.variantId}</span></div>
              ) : (
                <div className="previewCopy"><b>{(previewItem?.content as { label?: string } | undefined)?.label ?? draft.familyId}</b><span>{draft.variantId}</span></div>
              )}
            </div>
          </div>
        </div>
        <div className="previewFooter">
          <button className="btn" onClick={reset} type="button">恢复 AI 方案</button>
          <button className="btn" onClick={onClose} type="button">取消</button>
          <button className="btn primary" onClick={apply} type="button">确认修改</button>
        </div>
      </main>

      <aside className="labcol">
        <div className="phead">
          <strong>Draft 设置</strong>
          <span className="tiny">NO AI CALL</span>
        </div>
        <div className="labbody">
          <div className="groupTitle">进场 Enter</div>
          <div className="motionGrid">
            {enterMotions.map((motion) => (
              <button className={'motionBtn' + (draft.motion.enter.motionId === motion.motionId ? ' on' : '')} key={motion.motionId} onClick={() => setEnter(motion.motionId)} type="button">
                {motion.displayName ?? motion.motionId}<small>{motion.category}</small>
              </button>
            ))}
          </div>
          <div className="field range-field">
            <label htmlFor="enter-duration"><span>入场时长</span><b>{draft.motion.enter.durationSec.toFixed(2)}s</b></label>
          <input id="enter-duration" type="range" min="20" max="120" value={draft.motion.enter.durationSec * 100} onChange={(event) => setDraft((current) => current ? updateEffectDraftMotion(current, 'enter', { durationSec: Number(event.target.value) / 100 }) : current)} />
          </div>

          <div className="groupTitle">出场 Exit</div>
          <div className="motionGrid">
            {exitMotions.map((motion) => (
              <button className={'motionBtn' + (draft.motion.exit.motionId === motion.motionId ? ' on' : '')} key={motion.motionId} onClick={() => setExit(motion.motionId)} type="button">
                {motion.displayName ?? motion.motionId}<small>{motion.category}</small>
              </button>
            ))}
          </div>

          <div className="groupTitle">颜色 Color</div>
          <div className="swatches">
            {['#38D4BC', '#7868FF', '#63A7FF', '#FFB34E', '#FF5E78'].map((color) => (
              <button
                className={'swatch' + (draft.appearance.accent.toUpperCase() === color ? ' on' : '')}
                key={color}
                onClick={() => setColor(color)}
                style={{ background: color }}
                type="button"
              />
            ))}
          </div>

          <div className="groupTitle">音效 SFX</div>
          <select className="search" value={draft.sfx?.sfxId ?? 'none'} onChange={(event) => setSfx(event.target.value)}>
            <option value="soft-pop-03">★ Soft Pop 03 · AI选择</option>
            <option value="studio-whoosh-02">★ Studio Whoosh 02</option>
            <option value="glass-ding-01">Glass Ding 01</option>
            <option value="none">None</option>
          </select>
          <div className="summary">
            Variant {draft.variantId}
            <br />
            Enter: {draft.motion.enter.motionId}
            <br />
            Exit: {draft.motion.exit.motionId}
            <br />
            Color: {draft.appearance.accent}
            <br />
            SFX: {draft.sfx?.sfxId ?? 'None'}
          </div>
        </div>
      </aside>
    </div>
  );
}

function LearnView() {
  return (
    <div className="view learnview active" data-testid="learn-view">
      <aside className="learnNav">
        <div className="phead learn-head"><strong>自进化</strong><span className="tiny">LOCAL</span></div>
        {['总览', '坐标偏好', 'Variant 偏好', 'Motion 偏好', 'SFX 偏好', '成功案例', 'Director 规则'].map((label, index) => <button className={'learnItem' + (index === 0 ? ' active' : '')} key={label} type="button">{label}</button>)}
      </aside>
      <main className="learnMain">
        <div className="metrics"><div className="metric"><b>—</b><span>暂无真实学习样本</span></div><div className="metric"><b>—</b><span>坐标误差</span></div><div className="metric"><b>—</b><span>Motion 保留率</span></div><div className="metric"><b>—</b><span>SFX 保留率</span></div></div>
        <div className="family"><div className="ititle"><span>Semantic Preference · 坐标热区</span><span className="tiny">9:16 · NUMERIC · SUBJECT CENTER</span></div><div className="heat"><div className="target" /></div><div className="variants"><button className="choice on" type="button">X 0.735</button><button className="choice" type="button">Y 0.182</button><button className="choice" type="button">Scale .91</button><button className="choice" type="button">Confidence .87</button></div></div>
        <div className="family"><div className="ititle"><span>Episodic Memory · 最近成功样本</span><span className="tiny">DEMO DATA</span></div><div className="log"><span>—</span><span>暂无真实学习样本</span><span className="delta">—</span></div></div>
      </main>
      <aside className="rules"><div className="phead learn-head"><strong>Procedural Rules</strong><span className="tiny">DEMO DATA</span></div><div className="rule">暂无真实学习规则。<div className="confidence">等待导出样本</div></div></aside>
    </div>
  );
}

export function App() {
  const [store] = useState(() => createProjectStore(createFixtureProject()));
  const videoInputRef = useRef<HTMLInputElement>(null);
  const project = useStoreSnapshot(store);
  const [clock] = useState(() => createPlaybackClock({ durationSec: project.project.durationSec, fps: project.project.fps }));
  const [preferenceEngine] = useState(() => createPreferenceEngine());
  const clockSnapshot = useClockSnapshot(clock);
  const [view, setView] = useState<ViewId>('edit');
  const [selectedEffectId, setSelectedEffectId] = useState(project.effects[0]?.effectId ?? '');
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [sourceVideoFile, setSourceVideoFile] = useState<File | null>(null);
  const bundleInputRef = useRef<HTMLInputElement>(null);
  const [generationState, setGenerationState] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationDiagnostics, setGenerationDiagnostics] = useState<GenerationDiagnostics | null>(null);
  const [packagingState, setPackagingState] = useState<'idle' | 'preflight' | 'blocked' | 'generating' | 'success' | 'error'>('idle');
  const [packagingPlan, setPackagingPlan] = useState<PackagingPlan | null>(null);
  const [packagingResolvedCount, setPackagingResolvedCount] = useState(0);
  const [packagingAssetCount, setPackagingAssetCount] = useState(0);
  const [packagingError, setPackagingError] = useState<string | null>(null);
  const [packagingWarnings, setPackagingWarnings] = useState<string[]>([]);
  const [packagingWorkflow, setPackagingWorkflow] = useState<PackagingWorkflowStep[]>(createPackagingWorkflow);
  const [packagingPreferences, setPackagingPreferences] = useState({ density: 'auto' as 'low' | 'medium' | 'high' | 'auto', motionIntensity: 0.5, subjectAvoidPadding: 0.1, allowBehindSubject: true, maxConcurrentOverlays: 2, visualStyle: 'clean-tech' });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsConfigured, setSettingsConfigured] = useState(false);
  const [settingsApiKey, setSettingsApiKey] = useState('');
  const [visualAssetApiKey, setVisualAssetApiKey] = useState('');
  const [visualAssetApiKeyConfigured, setVisualAssetApiKeyConfigured] = useState(false);
  const [visualAssetProvider, setVisualAssetProvider] = useState<'disabled' | 'openai-compatible' | 'custom'>('disabled');
  const [visualAssetEndpoint, setVisualAssetEndpoint] = useState('');
  const [visualAssetModel, setVisualAssetModel] = useState('');
  const [visualAssetDefaultStyle, setVisualAssetDefaultStyle] = useState('tech_neon_3d');
  const [visualAssetMaxAssets, setVisualAssetMaxAssets] = useState(12);
  const [referenceImageConditioning, setReferenceImageConditioning] = useState<'auto' | 'on' | 'off'>('auto');
  const [bailianSettingsStatus, setBailianSettingsStatus] = useState<string | null>(null);
  const [visualSettingsStatus, setVisualSettingsStatus] = useState<string | null>(null);
  const [exportMode, setExportMode] = useState<'full-video' | 'transparent-mov' | 'transparent-webm'>('full-video');
  const [exportState, setExportState] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportAbortController, setExportAbortController] = useState<AbortController | null>(null);
  const [mediaProbeState, setMediaProbeState] = useState<'idle' | 'probing' | 'ready' | 'error'>('idle');
  const [mediaProbeError, setMediaProbeError] = useState<string | null>(null);
  const [browserPlaybackState, setBrowserPlaybackState] = useState<BrowserPlaybackState>(createInitialBrowserPlaybackState);
  const [browserPlaybackError, setBrowserPlaybackError] = useState<string | null>(null);
  const [externalBundleStatus, setExternalBundleStatus] = useState<string | null>(null);
  const [missingRequiredAssetIds, setMissingRequiredAssetIds] = useState<string[]>([]);
  const [projectStatus, setProjectStatus] = useState<string | null>(null);
  const realtimeEnabled = isRealtimeChromaCaptureEnabled();
  const [realtimeState, setRealtimeState] = useState<CaptureState>('IDLE');
  const [realtimeResult, setRealtimeResult] = useState<RealtimeCaptureResult | null>(null);
  const [realtimeError, setRealtimeError] = useState<string | null>(null);
  const [realtimeController] = useState(() => createRealtimeCaptureController({
    backend: createBrowserCanvasCaptureBackend(),
    forceEnabled: realtimeEnabled,
    onState: setRealtimeState,
  }));
  const [persistence] = useState(() => createProjectPersistence(window.localStorage));
  const [videoSourceManager] = useState(() => createVideoSourceManager({
    createObjectUrl: (file) => URL.createObjectURL(file),
    revokeObjectUrl: (url) => URL.revokeObjectURL(url),
  }));

  useEffect(() => {
    if (!clockSnapshot.playing || videoSrc) return;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      clock.advance((now - last) / 1000);
      last = now;
    }, 33);
    return () => window.clearInterval(timer);
  }, [clock, clockSnapshot.playing]);

  const togglePlayback = () => {
    const video = document.querySelector('[data-testid="preview-video"]') as HTMLVideoElement | null;
    if (clockSnapshot.playing) {
      video?.pause();
    } else if (video) {
      void video.play().catch(() => undefined);
    }
    clock.toggle();
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return;
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || (target instanceof HTMLElement && target.isContentEditable)) return;
      event.preventDefault();
      togglePlayback();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [clock, clockSnapshot.playing]);

  useEffect(() => () => videoSourceManager.dispose(), [videoSourceManager]);

  const handleVideoImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    clock.pause();
    clock.setTime(0);
    setSourceVideoFile(file);
    setMediaProbeState('probing');
    setMediaProbeError(null);
    setBrowserPlaybackState('loading-metadata');
    setBrowserPlaybackError(null);
    setGenerationState('idle');
    setGenerationError(null);
    setGenerationDiagnostics(null);
    setExternalBundleStatus(null);
    setMissingRequiredAssetIds([]);
    setVideoSrc(videoSourceManager.replace(file));
    const importedProject = createFixtureProject();
    importedProject.project.video.sourceFileName = file.name;
    importedProject.effects = [];
    importedProject.segments = [];
    importedProject.subtitles = [];
    importedProject.soundEvents = [];
    store.replaceComposition(importedProject);
    setSelectedEffectId('');
    store.setVideoReference({ name: file.name, size: file.size, lastModified: file.lastModified, type: file.type });
    void fetch('/api/probe-video', {
      method: 'POST',
      headers: { 'Content-Type': file.type || 'video/mp4', 'X-CueCut-Filename': encodeURIComponent(file.name) },
      body: file,
    }).then(async (response) => {
      if (!response.ok) throw new Error('FFprobe failed');
      const metadata = await response.json() as { durationSec: number; fps: number; width: number; height: number };
      if (!Number.isFinite(metadata.durationSec) || !Number.isFinite(metadata.fps) || !metadata.width || !metadata.height) throw new Error('FFprobe returned incomplete metadata');
      store.setVideoMetadata({ sourceFileName: file.name, durationSec: metadata.durationSec, fps: metadata.fps, canvasWidth: metadata.width, canvasHeight: metadata.height });
      clock.setDuration(metadata.durationSec, metadata.fps);
    }).then(() => {
      setMediaProbeState('ready');
    }).catch(() => {
      setMediaProbeState('error');
      setMediaProbeError('视频元数据读取失败，请重试或检查 FFprobe 配置');
    });
  };

  const handleExternalBundleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const bundleFile = files.find((file) => file.name.toLowerCase().endsWith('.json') || file.type === 'application/json');
    if (!bundleFile) {
      setExternalBundleStatus('无法载入包装 JSON：请选择 Bundle JSON 文件。');
      return;
    }
    try {
      const input = JSON.parse(await bundleFile.text()) as unknown;
      const result = importExternalBundle(input, store.getSnapshot(), files.filter((file) => file !== bundleFile).map((file) => ({ name: file.name, type: file.type })));
      store.replaceComposition(result.project);
      clock.setDuration(result.project.project.durationSec, result.project.project.fps);
      clock.setTime(0);
      setSelectedEffectId(result.project.effects[0]?.effectId ?? '');
      setMissingRequiredAssetIds(result.missingRequiredAssetIds);
      setExternalBundleStatus(result.status === 'partial'
        ? `包装已载入，但有 ${result.missingRequiredAssetIds.length} 个必需素材缺失，当前不可导出。`
        : `已载入外部包装：${result.project.effects.length} 个包装项，${result.boundAssetCount} 个素材已绑定。`);
      setView('edit');
    } catch (error) {
      setExternalBundleStatus(error instanceof Error ? `无法载入包装 JSON：${error.message}` : '无法载入包装 JSON：文件结构不符合 CueCut Bundle v1。');
    } finally {
      event.target.value = '';
    }
  };

  const preferenceProfile = useMemo(
    () => createPreferenceProfile(project.project.aspectRatio, preferenceEngine.all()),
    [preferenceEngine, project.project.aspectRatio],
  );

  const handleGenerateEffects = async () => {
    if (!sourceVideoFile || mediaProbeState !== 'ready' || generationState === 'generating') return;
    setGenerationState('generating');
    setGenerationError(null);
    setGenerationDiagnostics(null);
    try {
      const response = await fetch('/api/generate-effects', {
        method: 'POST',
        headers: {
          'Content-Type': sourceVideoFile.type || 'video/mp4',
          'X-CueCut-Filename': encodeURIComponent(sourceVideoFile.name),
          'X-CueCut-Preferences': encodeURIComponent(JSON.stringify(preferenceProfile)),
        },
        body: sourceVideoFile,
      });
      const payload = await response.json() as {
        message?: string;
        transcript?: TranscriptSegment[];
        composition?: ProjectComposition;
        usedFallback?: boolean;
        warnings?: string[];
        selectionTrace?: SelectionTraceEntry[];
      };
      if (!response.ok || !payload.composition || !payload.transcript) {
        throw new Error(payload.message ?? ('生成失败（HTTP ' + response.status + '）'));
      }
      store.replaceComposition({ ...payload.composition, subtitles: payload.transcript });
      clock.setDuration(payload.composition.project.durationSec, payload.composition.project.fps);
      clock.setTime(0);
      setSelectedEffectId(payload.composition.effects[0]?.effectId ?? '');
      setView('edit');
      setGenerationDiagnostics({
        usedFallback: payload.usedFallback === true,
        warnings: Array.isArray(payload.warnings) ? payload.warnings : [],
        selectionTrace: Array.isArray(payload.selectionTrace) ? payload.selectionTrace : [],
      });
      setGenerationState('success');
    } catch (error) {
      setGenerationState('error');
      setGenerationError(error instanceof Error ? error.message : '生成失败');
    }
  };

  const handleGeneratePackaging = async () => {
    if (!sourceVideoFile || mediaProbeState !== 'ready' || packagingState === 'preflight' || packagingState === 'generating') return;
    let activeStep: PackagingWorkflowStepId = 'preflight';
    const updateStep = (id: PackagingWorkflowStepId, status: PackagingWorkflowStep['status'], detail?: string) => {
      activeStep = id;
      setPackagingWorkflow((current) => current.map((step) => step.id === id ? { ...step, status, ...(detail ? { detail } : {}) } : step));
    };
    setPackagingWorkflow(createPackagingWorkflow());
    setPackagingState('preflight');
    setPackagingError(null);
    setPackagingWarnings([]);
    updateStep('preflight', 'running');
    try {
      const capabilityResponse = await fetch('/api/runtime-capabilities');
      const capability = await capabilityResponse.json() as { director?: { configured?: boolean } };
      if (!capabilityResponse.ok || capability.director?.configured !== true) {
        updateStep('preflight', 'failed', '主模型未配置');
        setPackagingState('blocked');
        setPackagingError('无法开始生成：请先配置阿里云百炼 API Key 和主模型。');
        return;
      }
    } catch {
      updateStep('preflight', 'failed', '运行时能力检查失败');
      setPackagingState('blocked');
      setPackagingError('无法开始生成：运行时能力检查失败，请检查本地服务。');
      return;
    }
    updateStep('preflight', 'success');
    updateStep('video-read', 'success', `${sourceVideoFile.name} 已就绪`);
    setPackagingState('generating');
    try {
      let transcript = project.subtitles;
      if (transcript.length === 0) {
        updateStep('video-audio', 'running', '服务端提取音频');
        updateStep('audio-srt', 'running', '等待 ASR 返回');
        const transcriptionResponse = await fetch('/api/transcribe-video', {
          method: 'POST',
          headers: {
            'Content-Type': sourceVideoFile.type || 'video/mp4',
            'X-CueCut-Filename': encodeURIComponent(sourceVideoFile.name),
          },
          body: sourceVideoFile,
        });
        const transcriptionPayload = await transcriptionResponse.json() as { message?: string; transcript?: TranscriptSegment[] };
        if (!transcriptionResponse.ok || !Array.isArray(transcriptionPayload.transcript)) {
          throw new Error(transcriptionPayload.message ?? ('SRT 生成失败（HTTP ' + transcriptionResponse.status + '）'));
        }
        updateStep('video-audio', 'success', '音频已提取');
        updateStep('audio-srt', 'success', `${transcriptionPayload.transcript.length} 段字幕`);
        transcript = transcriptionPayload.transcript;
        store.setSubtitles(transcript);
      } else {
        updateStep('video-audio', 'success', '使用已有音频结果');
        updateStep('audio-srt', 'success', `${transcript.length} 段已有字幕`);
      }
      const projectForPackaging = store.getSnapshot();
      updateStep('director', 'running', '调用一次 Packaging Director');
      const response = await fetch('/api/generate-packaging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis: {
            videoMeta: { width: projectForPackaging.project.canvasWidth, height: projectForPackaging.project.canvasHeight, fps: projectForPackaging.project.fps, durationSec: projectForPackaging.project.durationSec },
            transcript,
            scenes: [{ id: 'scene-0', startSec: 0, endSec: projectForPackaging.project.durationSec }],
            subjects: [], faces: [], safeZones: [],
            edgeInsets: { top: 0.04, bottom: 0.08, left: 0.05, right: 0.05 },
            audioEnvelope: [], beats: [], sceneDensity: [],
            effectLibrary: effectRegistry.map((effect) => ({ familyId: effect.familyId, variantId: effect.variantId, displayName: effect.displayName, contentSlots: effect.contentSlots, tags: [...effect.semanticTags, ...(effect.visualTags ?? [])] })),
            motionLibrary: motionRegistry.map((motion) => ({ motionId: motion.motionId, role: motion.role, category: motion.category })),
          },
          project: { projectId: projectForPackaging.project.projectId, durationSec: projectForPackaging.project.durationSec, fps: projectForPackaging.project.fps, canvasWidth: projectForPackaging.project.canvasWidth, canvasHeight: projectForPackaging.project.canvasHeight, aspectRatio: projectForPackaging.project.aspectRatio },
          preferences: { style: packagingPreferences.visualStyle, energy: 'medium', ...packagingPreferences },
        }),
      });
      const payload = await response.json() as { message?: string; plan?: PackagingPlan; aiCallCount?: number };
      if (!response.ok || !payload.plan) throw new Error(payload.message ?? ('包装生成失败（HTTP ' + response.status + '）'));
      if (payload.aiCallCount !== 1) throw new Error('Packaging Director 必须严格调用 1 次');
      updateStep('director', 'success', '1 次调用完成');
      const groundingUnits = payload.plan.timeline.filter((item) => item.keyClaim !== undefined || item.evidenceText !== undefined).map((item) => ({ id: item.id, sourceSubtitleIds: item.sourceSubtitleIds ?? [], keyClaim: item.keyClaim, evidenceText: item.evidenceText, visualValue: item.visualValue, content: item.content }));
      const grounding = groundingUnits.length > 0 ? validateVisualGrounding(groundingUnits, transcript) : null;
      if (grounding?.fatal.length) throw new Error(`包装语义校验失败：${grounding.fatal[0]!.message}`);
      const acceptedGroundedIds = new Set(grounding?.acceptedUnitIds ?? []);
      const planForResolve = grounding ? { ...payload.plan, timeline: payload.plan.timeline.filter((item) => !groundingUnits.some((unit) => unit.id === item.id) || acceptedGroundedIds.has(item.id)) } : payload.plan;
      updateStep('asset-plan', 'running');
      const assetCandidates = planVisualAssets(payload.plan, { styleId: 'tech_neon_3d', maxAssets: 12 });
      setPackagingAssetCount(assetCandidates.length);
      updateStep('asset-plan', 'success', `${assetCandidates.length} 个候选`);
      const generatedAssetRefs = new Map<string, string>();
      updateStep('visual-generation', 'running', assetCandidates.length > 0 ? '提交冻结的 Atlas 计划' : '没有需要生图的资产');
      if (assetCandidates.length === 0) {
        updateStep('visual-generation', 'success', '无 raster asset，已跳过');
      } else {
        const atlasPages = planAtlasPages(assetCandidates.map((candidate) => candidate.assetId));
        const atlasPlans = atlasPages.map((page) => ({
          ...page,
          prompt: buildAtlasPrompt(page, 'tech_neon_3d'),
          candidates: page.slots.map((slot) => assetCandidates.find((candidate) => candidate.assetId === slot.assetId)).filter(Boolean),
        }));
        try {
          const assetResponse = await fetch('/api/generate-visual-assets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ styleId: 'tech_neon_3d', atlasPlans, referenceImage: null }) });
          const assetPayload = await assetResponse.json() as { ok?: boolean; status?: 'disabled' | 'generated'; assets?: Array<{ assetId?: string; page?: number; imageBase64?: string }>; message?: string };
          if (!assetResponse.ok || assetPayload.status === undefined) throw new Error(assetPayload.message ?? `视觉资产生成失败（HTTP ${assetResponse.status}）`);
          for (const asset of assetPayload.assets ?? []) {
            if (typeof asset.assetId === 'string' && typeof asset.imageBase64 === 'string' && asset.imageBase64.trim()) generatedAssetRefs.set(asset.assetId, asset.imageBase64.startsWith('data:') ? asset.imageBase64 : `data:image/png;base64,${asset.imageBase64}`);
          }
          if (assetPayload.status === 'disabled') {
            updateStep('visual-generation', 'success', 'Provider 未启用，已跳过');
            setPackagingWarnings((current) => [...current, '视觉资产生图服务未配置，已跳过生图；原生文字和动效仍会继续生成。']);
          } else {
            updateStep('visual-generation', 'success', `${generatedAssetRefs.size}/${assetCandidates.length} 个资产返回`);
            if (generatedAssetRefs.size < assetCandidates.length) setPackagingWarnings((current) => [...current, '部分视觉资产未返回，已回退到原生包装。']);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : '未知错误';
          updateStep('visual-generation', 'failed', `${message}；已回退原生包装`);
          setPackagingWarnings((current) => [...current, '视觉资产生成失败，已回退到原生包装。']);
        }
      }
      setPackagingPlan(planForResolve);
      updateStep('resolve-layout', 'running');
      const resolved = resolvePackagingPlan(planForResolve);
      const validation = validateResolvedPackagingPlan({ durationSec: projectForPackaging.project.durationSec, maxConcurrentOverlays: planForResolve.constraints.maxConcurrentOverlays, overlays: resolved.overlays });
      if (!validation.valid) throw new Error(`包装校验失败：${validation.issues[0]!.message}`);
      updateStep('resolve-layout', 'success', `${resolved.runtimeTimeline.items.length} 个时间项`);
      const appliedProject = applyResolvedPackagingToProject(projectForPackaging, {
        overlays: resolved.overlays,
        chapters: planForResolve.chapters?.map((chapter) => ({ id: chapter.id, title: chapter.title, startSec: chapter.startSec, endSec: chapter.endSec })),
      });
      const assetBoundProject: ProjectComposition = generatedAssetRefs.size === 0 ? appliedProject : {
        ...appliedProject,
        effects: appliedProject.effects.map((effect) => {
          const assetId = assetRequestId(effect.content);
          const projectAssetRef = assetId ? generatedAssetRefs.get(assetId) : undefined;
          return projectAssetRef && assetId ? { ...effect, asset: { assetId, source: 'generated' as const, projectAssetRef } } : effect;
        }),
      };
      updateStep('runtime', 'running');
      const runtimeItems = compileProjectToRuntime(assetBoundProject);
      if (runtimeItems.length !== assetBoundProject.effects.length) throw new Error('Runtime 编译结果与 Workspace effect 数量不一致');
      updateStep('runtime', 'success', `${runtimeItems.length} 个 RuntimeItem`);
      store.replaceComposition(assetBoundProject);
      setSelectedEffectId(assetBoundProject.effects[0]?.effectId ?? '');
      setPackagingResolvedCount(resolved.runtimeTimeline.items.length);
      updateStep('workspace', 'success', '已载入当前项目');
      setPackagingState('success');
    } catch (error) {
      updateStep(activeStep, 'failed', error instanceof Error ? error.message : '未知错误');
      setPackagingState('error');
      setPackagingError(error instanceof Error ? error.message : '包装生成失败');
    }
  };

  const handleExport = async () => {
    if (exportState === 'exporting' || mediaProbeState !== 'ready' || missingRequiredAssetIds.length > 0 || (exportMode === 'full-video' && !sourceVideoFile)) return;
    setExportState('exporting');
    setExportError(null);
    const abortController = new AbortController();
    setExportAbortController(abortController);
    try {
      const compositionJson = JSON.stringify(project);
      const isFullVideoExport = exportMode === 'full-video';
      const requestBody = isFullVideoExport
        ? new Blob([compositionJson, '\n', sourceVideoFile!], { type: 'application/x-cuecut-export' })
        : JSON.stringify({ composition: project });
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': isFullVideoExport ? 'application/x-cuecut-export' : 'application/json',
          'X-CueCut-Export-Mode': exportMode,
          'X-CueCut-Filename': encodeURIComponent(sourceVideoFile?.name ?? (exportMode === 'transparent-webm' ? 'cuecut-overlay.webm' : 'cuecut-overlay.mov')),
        },
        body: requestBody,
        signal: abortController.signal,
      });
      if (!response.ok) {
        const payload = await readJsonError(response);
        throw new Error(payload.message ?? ('导出失败（HTTP ' + response.status + '）'));
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
       anchor.download = exportMode === 'transparent-mov' ? 'cuecut-overlay.mov' : exportMode === 'transparent-webm' ? 'cuecut-overlay.webm' : 'cuecut-export.mp4';
      anchor.click();
      URL.revokeObjectURL(url);
      setExportState('success');
    } catch (error) {
      if (abortController.signal.aborted) {
        setExportState('idle');
        return;
      }
      setExportState('error');
      setExportError(error instanceof Error ? error.message : '导出失败');
    } finally {
      setExportAbortController(null);
    }
  };

  async function readJsonError(response: Response): Promise<{ message?: string }> {
    const body = await response.text();
    if (!body.trim()) return {};
    try {
      const payload = JSON.parse(body) as { message?: unknown };
      return { message: typeof payload.message === 'string' ? payload.message : undefined };
    } catch {
      return { message: body.trim().slice(0, 240) };
    }
  }

  const handleCancelExport = () => exportAbortController?.abort();

  const handleOpenSettings = async () => {
    setSettingsOpen((current) => !current);
    if (settingsOpen) return;
    try {
      const response = await fetch('/api/settings');
      const payload = await response.json() as {
        bailianApiKeyConfigured?: boolean;
        visualAssetApiKeyConfigured?: boolean;
        visualAssetProvider?: 'disabled' | 'openai-compatible' | 'custom';
        visualAssetEndpoint?: string;
        visualAssetModel?: string;
        visualAssetDefaultStyle?: string;
        visualAssetMaxAssets?: number;
        referenceImageConditioning?: 'auto' | 'on' | 'off';
      };
      setSettingsConfigured(payload.bailianApiKeyConfigured === true);
      setVisualAssetApiKeyConfigured(payload.visualAssetApiKeyConfigured === true);
      if (payload.visualAssetProvider) setVisualAssetProvider(payload.visualAssetProvider);
      if (typeof payload.visualAssetEndpoint === 'string') setVisualAssetEndpoint(payload.visualAssetEndpoint);
      if (typeof payload.visualAssetModel === 'string') setVisualAssetModel(payload.visualAssetModel);
      if (typeof payload.visualAssetDefaultStyle === 'string') setVisualAssetDefaultStyle(payload.visualAssetDefaultStyle);
      if (typeof payload.visualAssetMaxAssets === 'number') setVisualAssetMaxAssets(payload.visualAssetMaxAssets);
      if (payload.referenceImageConditioning) setReferenceImageConditioning(payload.referenceImageConditioning);
      setBailianSettingsStatus(null);
      setVisualSettingsStatus(null);
    } catch {
      setBailianSettingsStatus('读取设置失败：设置服务不可用');
      setVisualSettingsStatus('读取设置失败：设置服务不可用');
    }
  };

  const handleSaveSettings = async (section: 'bailian' | 'visual') => {
    const isBailian = section === 'bailian';
    const setStatus = isBailian ? setBailianSettingsStatus : setVisualSettingsStatus;
    setStatus(null);
    try {
      const body = isBailian
        ? { apiKey: settingsApiKey }
        : {
            ...(visualAssetApiKey.trim() ? { visualAssetApiKey } : {}),
            visualAssetProvider,
            visualAssetEndpoint,
            visualAssetModel,
            visualAssetDefaultStyle,
            visualAssetMaxAssets,
            referenceImageConditioning,
          };
      const response = await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const payload = await response.json() as { ok?: boolean; message?: string; bailianApiKeyConfigured?: boolean; visualAssetApiKeyConfigured?: boolean };
      if (!response.ok || payload.ok !== true) throw new Error(payload.message ?? '保存失败');
      if (isBailian) {
        setSettingsConfigured(true);
        setSettingsApiKey('');
        setStatus('保存成功：阿里百炼 API Key 已保存');
      } else {
        setVisualAssetApiKeyConfigured(payload.visualAssetApiKeyConfigured === true || visualAssetApiKeyConfigured || Boolean(visualAssetApiKey.trim()));
        setVisualAssetApiKey('');
        setStatus('保存成功：视觉资产设置已保存');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误';
      setStatus(message.startsWith('保存失败') ? message : `保存失败：${message}`);
    }
  };

  const handleRealtimeCapture = async (durationSec?: number) => {
    if (!['IDLE', 'SUCCESS', 'FAILED', 'CANCELLED'].includes(realtimeState)) return;
    setRealtimeResult(null);
    setRealtimeError(null);
    try {
      const result = await realtimeController.start({ project, projectName: project.project.projectId, durationSecOverride: durationSec });
      const response = await fetch('/api/realtime-capture', { method: 'POST', headers: { 'Content-Type': result.mimeType, 'X-CueCut-Job-Id': result.jobId, 'X-CueCut-Filename': encodeURIComponent(result.fileName) }, body: result.blob });
      if (!response.ok) throw new Error('Realtime capture temporary output could not be persisted');
      setRealtimeResult(result);
    } catch (error) {
      setRealtimeError(error instanceof Error ? error.message : '极速抠像失败');
    }
  };

  const handleSaveProject = () => {
    persistence.save(project);
    setProjectStatus('项目已保存');
  };

  const handleContinueProject = () => {
    const saved = persistence.continueProject();
    if (!saved) {
      setProjectStatus('暂无已保存项目');
      return;
    }
    store.replaceComposition(saved);
    clock.setDuration(saved.project.durationSec, saved.project.fps);
    clock.setTime(0);
    setSelectedEffectId(saved.effects[0]?.effectId ?? '');
    setProjectStatus(saved.project.video.mediaReference ? '已继续上次项目，请重新导入媒体' : '已继续上次项目');
  };

  const onSelect = (effectId: string) => setSelectedEffectId(effectId);
  const onSeek = (timeSec: number) => clock.setTime(timeSec);

  return (
    <div className="app">
      <header className="top">
        <div className="logo">CueCut <span className="ver">V2 · DIRECTOR</span></div>
        <button className="btn" onClick={togglePlayback} type="button">{clockSnapshot.playing ? '❚❚ 暂停' : '▶ 播放'}</button>
        <span className="time">{clockSnapshot.currentTime.toFixed(2)}s / {project.project.durationSec.toFixed(2)}s</span>
        <span className="director">◆ AI Director · 本地一次调用边界</span>
        <span className="pill">后续调整全部本地</span>
        <span className="spacer" />
        <input ref={videoInputRef} accept="video/*" className="file-input" data-testid="video-input" id="video-input" onChange={handleVideoImport} type="file" />
        <input ref={bundleInputRef} accept=".json,application/json,image/png,image/jpeg,image/webp,image/svg+xml" className="file-input" data-testid="packaging-bundle-input" multiple onChange={(event) => void handleExternalBundleImport(event)} type="file" />
        <button className="btn import-video-control" data-testid="video-import-control" onClick={() => videoInputRef.current?.click()} type="button">导入视频</button>
        <button className="btn" onClick={() => bundleInputRef.current?.click()} type="button">载入包装 JSON</button>
        <span className="file-name">{project.project.video.sourceFileName ?? '未导入视频'}</span>
        <button className="btn primary" disabled={!sourceVideoFile || mediaProbeState !== 'ready' || generationState === 'generating' || generationState === 'success'} onClick={() => void handleGenerateEffects()} type="button">
          {generationState === 'generating' ? '生成中…' : generationState === 'success' ? generationDiagnostics?.usedFallback ? '已载入（本地回退）' : '已生成并载入' : '开始生成动效'}
        </button>
        <button className="btn primary" data-testid="packaging-generate-button" disabled={!sourceVideoFile || mediaProbeState !== 'ready' || packagingState === 'preflight' || packagingState === 'generating'} onClick={() => void handleGeneratePackaging()} type="button">
          {packagingState === 'preflight' ? '检查配置中…' : packagingState === 'generating' ? '生成 AI 包装中…' : '生成 AI 包装'}
        </button>
        {packagingState === 'preflight' && <span className="tiny" data-testid="packaging-status">检查主模型配置…</span>}
        {packagingState === 'generating' && <span className="tiny" data-testid="packaging-status">提取音频 → 生成 SRT → SRT+动效库 → 一次 AI 生成 → 生成包装</span>}
        {packagingState === 'success' && packagingPlan && <span className="tiny" data-testid="packaging-status">已生成包装计划 · {packagingPlan.timeline.length} 个意图 · {packagingResolvedCount} 个已排版 · {packagingAssetCount} 个视觉资产候选 · AI 1 次</span>}
        {packagingError && <span className="tiny error" role="alert">{packagingError}</span>}
        {packagingWarnings.length > 0 && <span className="tiny error" data-testid="packaging-warnings" role="alert">警告：{packagingWarnings.join('；')}</span>}
        <ol className="packaging-workflow" data-testid="packaging-workflow" aria-label="包装生成工作流">
          {packagingWorkflow.map((step) => <li data-stage-id={step.id} data-stage-status={step.status} key={step.id}><span>{step.label} · {step.status === 'pending' ? '等待' : step.status === 'running' ? '进行中' : step.status === 'success' ? '成功' : '失败'}</span>{step.detail && <small> · {step.detail}</small>}</li>)}
        </ol>
        <details className="packaging-settings">
          <summary>包装设置</summary>
          <div className="packaging-settings-panel">
            <label>包装密度<select aria-label="包装密度" value={packagingPreferences.density} onChange={(event) => setPackagingPreferences((current) => ({ ...current, density: event.target.value as typeof current.density }))}><option value="auto">自动</option><option value="low">低</option><option value="medium">中</option><option value="high">高</option></select></label>
            <label>动效强度<input aria-label="动效强度" type="range" min="0" max="1" step="0.05" value={packagingPreferences.motionIntensity} onChange={(event) => setPackagingPreferences((current) => ({ ...current, motionIntensity: Number(event.target.value) }))} /></label>
            <label>人物避让距离<input aria-label="人物避让距离" type="number" min="0" max="50" step="1" value={Math.round(packagingPreferences.subjectAvoidPadding * 100)} onChange={(event) => setPackagingPreferences((current) => ({ ...current, subjectAvoidPadding: Number(event.target.value) / 100 }))} />%</label>
            <label><input aria-label="允许人物后方文字" type="checkbox" checked={packagingPreferences.allowBehindSubject} onChange={(event) => setPackagingPreferences((current) => ({ ...current, allowBehindSubject: event.target.checked }))} />允许人物后方文字</label>
            <label>最大同时包装数量<input aria-label="最大同时包装数量" type="number" min="1" max="8" value={packagingPreferences.maxConcurrentOverlays} onChange={(event) => setPackagingPreferences((current) => ({ ...current, maxConcurrentOverlays: Number(event.target.value) }))} /></label>
          </div>
        </details>
        {generationState === 'generating' && <span className="tiny" data-testid="generation-status">提取音频 → ASR → Director → Workspace</span>}
        {generationState === 'success' && generationDiagnostics?.usedFallback && <span className="tiny error" data-testid="generation-fallback">⚠ 已使用本地回退，结果已载入（非 Director 成功）</span>}
        {generationState === 'success' && <span className="tiny" data-testid="generation-status">{generationDiagnostics?.usedFallback ? '已载入 Workspace · 非 Director 成功' : '已载入 Workspace'}</span>}
        {generationState === 'success' && generationDiagnostics && generationDiagnostics.warnings.length > 0 && <span className="tiny error" data-testid="generation-warnings">警告：{generationDiagnostics.warnings.join('；')}</span>}
        {generationError && <span className="tiny error" role="alert">{generationError}</span>}
        {mediaProbeError && <span className="tiny error" role="alert">{mediaProbeError}</span>}
        {videoSrc && <span className="tiny" data-testid="video-playback-status">{browserPlaybackState === 'can-play' ? '视频预览可用' : `视频预览：${browserPlaybackState}`}</span>}
        {browserPlaybackError && <span className="tiny error" role="alert">{browserPlaybackError}</span>}
        <button className="btn" disabled={store.undoDepth() === 0} onClick={() => store.undo()} type="button">↶</button>
        <button className="btn" disabled={store.redoDepth() === 0} onClick={() => store.redo()} type="button">↷</button>
        <select aria-label="导出模式" className="export-mode" title="选择导出格式" value={exportMode} onChange={(event) => setExportMode(event.target.value as typeof exportMode)}>
          <option value="full-video">MP4 · 完整视频</option>
          <option value="transparent-mov">MOV · 透明叠加</option>
          <option value="transparent-webm">WebM · 透明叠加</option>
        </select>
        <button aria-label="导出" className="btn primary export-action" disabled={exportState === 'exporting' || mediaProbeState !== 'ready' || missingRequiredAssetIds.length > 0 || (exportMode === 'full-video' && !sourceVideoFile)} onClick={() => void handleExport()} title="导出当前项目视频文件" type="button">
          {exportState === 'exporting' ? '导出中…' : '导出文件'}
        </button>
        {exportState === 'exporting' && <button className="btn" onClick={handleCancelExport} type="button">取消导出</button>}
        {exportState === 'success' && <span className="tiny" data-testid="export-status">已生成本地文件</span>}
        {exportError && <span className="tiny error" role="alert">{exportError}</span>}
        {externalBundleStatus && <span className={'tiny' + (missingRequiredAssetIds.length > 0 ? ' error' : '')} data-testid="external-bundle-status" role={missingRequiredAssetIds.length > 0 ? 'alert' : 'status'}>{externalBundleStatus}</span>}
        <RealtimeCapturePanel
          enabled={realtimeEnabled}
          state={realtimeState}
          result={realtimeResult}
          error={realtimeError}
          onStart={(durationSec) => void handleRealtimeCapture(durationSec)}
          onCancel={() => realtimeController.cancel()}
          onDownload={() => { if (realtimeResult) createRealtimeCaptureDownload(realtimeResult); }}
        />
        <button aria-label="保存" className="btn" onClick={handleSaveProject} title="保存当前项目到本机" type="button">保存项目</button>
        <button aria-label="继续" className="btn" onClick={handleContinueProject} title="继续上次保存的项目" type="button">继续项目</button>
        <button className="btn" aria-expanded={settingsOpen} aria-haspopup="dialog" onClick={() => void handleOpenSettings()} type="button">设置</button>
        {settingsOpen && <div className="settings-popover" role="dialog" aria-label="设置">
          <div className="phead"><strong>设置</strong><button className="btn" onClick={() => setSettingsOpen(false)} type="button">关闭</button></div>
          <section>
            <strong>大模型 API Key</strong>
            <div className="tiny">阿里百炼 · {settingsConfigured ? '已配置' : '未配置'}</div>
            <label>阿里百炼 API Key<input aria-label="阿里百炼 API Key" type="password" value={settingsApiKey} onChange={(event) => setSettingsApiKey(event.target.value)} placeholder="输入后保存，不会回显" /></label>
            <button className="btn primary" disabled={!settingsApiKey.trim()} onClick={() => void handleSaveSettings('bailian')} type="button">保存 API Key</button>
            {bailianSettingsStatus && <div className="tiny" data-testid="bailian-settings-status">{bailianSettingsStatus}</div>}
          </section>
          <section>
            <strong>第三方 API 生图</strong>
            <div className="tiny">视觉资产 API Key · {visualAssetApiKeyConfigured ? '已配置' : '未配置'}</div>
            <label>Provider<select aria-label="视觉资产 Provider" value={visualAssetProvider} onChange={(event) => setVisualAssetProvider(event.target.value as typeof visualAssetProvider)}><option value="disabled">关闭</option><option value="openai-compatible">OpenAI Compatible</option><option value="custom">Custom</option></select></label>
            <label>Endpoint<input aria-label="视觉资产 Endpoint" type="url" value={visualAssetEndpoint} onChange={(event) => setVisualAssetEndpoint(event.target.value)} placeholder="https://…" /></label>
            <label>模型<input aria-label="视觉资产模型" type="text" value={visualAssetModel} onChange={(event) => setVisualAssetModel(event.target.value)} /></label>
            <label>视觉资产 API Key<input aria-label="视觉资产 API Key" type="password" value={visualAssetApiKey} onChange={(event) => setVisualAssetApiKey(event.target.value)} placeholder="输入后保存，不会回显" /></label>
            <label>默认风格<input aria-label="视觉资产默认风格" type="text" value={visualAssetDefaultStyle} onChange={(event) => setVisualAssetDefaultStyle(event.target.value)} /></label>
            <label>每次最多生成资产<input aria-label="视觉资产数量上限" type="number" min="1" max="12" value={visualAssetMaxAssets} onChange={(event) => setVisualAssetMaxAssets(Number(event.target.value))} /></label>
            <label>参考图条件<select aria-label="参考图条件" value={referenceImageConditioning} onChange={(event) => setReferenceImageConditioning(event.target.value as typeof referenceImageConditioning)}><option value="auto">自动</option><option value="on">开启</option><option value="off">关闭</option></select></label>
            <button className="btn primary" onClick={() => void handleSaveSettings('visual')} type="button">保存视觉资产设置</button>
            {visualSettingsStatus && <div className="tiny" data-testid="visual-settings-status">{visualSettingsStatus}</div>}
          </section>
        </div>}
        {projectStatus && <span className="tiny" data-testid="project-status">{projectStatus}</span>}
      </header>
      {generationState === 'success' && generationDiagnostics && generationDiagnostics.selectionTrace.length > 0 && (
        <section className="director-trace" data-testid="selection-trace" aria-label="Director Selection Trace">
          <strong>Director Selection Trace</strong>
          {generationDiagnostics.selectionTrace.map((entry) => (
            <div className="trace-entry" data-testid={`selection-trace-${entry.visualUnitId}`} key={entry.visualUnitId}>
              <span>VisualUnit: {entry.visualUnitId}</span>
              <span>semanticIntent: {entry.semanticIntent}</span>
              {entry.selected && <span>selected: {entry.selected}</span>}
              {entry.retrievedCandidates.length > 0 && <span>retrievedCandidates: {entry.retrievedCandidates.join(', ')}</span>}
              <span>Data Contract: {entry.dataContractPassed ? '通过' : '未通过'} · Duration Contract: {entry.durationContractPassed ? '通过' : '未通过'}</span>
            </div>
          ))}
        </section>
      )}
      <section className="workspace">
        <nav className="nav" aria-label="主导航">
          {navItems.map((item) => (
            <button className={'navitem' + (view === item.id ? ' active' : '')} key={item.id} onClick={() => setView(item.id)} type="button">
              <b>{item.icon}</b><span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="views">
          {view === 'edit' && <EditView project={project} store={store} currentTime={clockSnapshot.currentTime} selectedEffectId={selectedEffectId} videoSrc={videoSrc} playing={clockSnapshot.playing} onSelect={onSelect} onSeek={onSeek} subtitleItems={project.subtitles} onSubtitleItemsChange={(items) => store.setSubtitles(items)} subtitleSettings={project.subtitleSettings} onSubtitleSettingsChange={(update) => store.setSubtitleSettings(update)} onVideoMetadata={() => undefined} onVideoPlaybackState={setBrowserPlaybackState} onVideoPlaybackError={setBrowserPlaybackError} onOpenLab={() => setView('lab')} />}
          {view === 'lab' && <EffectLabView project={project} store={store} selectedEffectId={selectedEffectId} onClose={() => setView('edit')} />}
          {view === 'sfx' && <SfxLibrary store={store} selectedEffectId={selectedEffectId} />}
          {view === 'learn' && <LearnView />}
        </div>
      </section>
      <Timeline project={project} store={store} currentTime={clockSnapshot.currentTime} onSelect={onSelect} onSeek={onSeek} />
    </div>
  );
}
