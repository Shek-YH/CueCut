import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { EffectInstance, ProjectComposition } from '../project/schema';
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
import type { SelectionTraceEntry } from '../director/types';
import { createBrowserCanvasCaptureBackend } from '../export/realtime/browserCanvasBackend';
import { createRealtimeCaptureController } from '../export/realtime/controller';
import { createRealtimeCaptureDownload } from '../export/realtime/finalizer';
import { isRealtimeChromaCaptureEnabled } from '../export/realtime/featureFlag';
import type { CaptureState, RealtimeCaptureResult } from '../export/realtime/types';
import { RealtimeCapturePanel } from '../editor/realtime/RealtimeCapturePanel';
import { previewTimeForEffect } from '../editor/selection/previewTime';

type ViewId = 'edit' | 'lab' | 'sfx' | 'learn';

type GenerationDiagnostics = {
  usedFallback: boolean;
  warnings: string[];
  selectionTrace: SelectionTraceEntry[];
};

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
  onVideoMetadata,
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
  onVideoMetadata: (metadata: { durationSec: number; canvasWidth: number; canvasHeight: number }) => void;
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
          <SrtQuickPanel currentTime={currentTime} onSeek={onSeek} items={subtitleItems} onItemsChange={onSubtitleItemsChange} />
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
    setDraft((current) =>
      current
        ? { ...current, motion: { ...current.motion, enter: { ...current.motion.enter, motionId } } }
        : current,
    );
  const setExit = (motionId: string) =>
    setDraft((current) =>
      current
        ? { ...current, motion: { ...current.motion, exit: { ...current.motion.exit, motionId } } }
        : current,
    );
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
            <div className="previewCard" data-testid="preview-content" style={{ opacity: previewItem?.opacity ?? previewFrame.opacity, transform: previewItemTransform, filter: previewItem?.blur ? `blur(${previewItem.blur}px)` : undefined }}>
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
                <div className="previewCopy"><b>{previewItem?.content.label ?? draft.familyId}</b><span>{draft.variantId}</span></div>
              )}
            </div>
          </div>
        </div>
        <div className="previewFooter">
          <button className="btn" onClick={reset} type="button">恢复 AI 方案</button>
          <button className="btn" onClick={onClose} type="button">取消</button>
          <button className="btn primary" onClick={apply} type="button">应用到 Workspace</button>
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
            <input id="enter-duration" type="range" min="20" max="120" value={draft.motion.enter.durationSec * 100} onChange={(event) => setDraft((current) => current ? { ...current, motion: { ...current.motion, enter: { ...current.motion.enter, durationSec: Number(event.target.value) / 100 } } } : current)} />
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
  const project = useStoreSnapshot(store);
  const [clock] = useState(() => createPlaybackClock({ durationSec: project.project.durationSec, fps: project.project.fps, initialTime: 6.6 }));
  const [preferenceEngine] = useState(() => createPreferenceEngine());
  const clockSnapshot = useClockSnapshot(clock);
  const [view, setView] = useState<ViewId>('edit');
  const [selectedEffectId, setSelectedEffectId] = useState(project.effects[0]?.effectId ?? '');
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [sourceVideoFile, setSourceVideoFile] = useState<File | null>(null);
  const [generationState, setGenerationState] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationDiagnostics, setGenerationDiagnostics] = useState<GenerationDiagnostics | null>(null);
  const [exportMode, setExportMode] = useState<'full-video' | 'transparent-mov'>('full-video');
  const [exportState, setExportState] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportAbortController, setExportAbortController] = useState<AbortController | null>(null);
  const [mediaProbeState, setMediaProbeState] = useState<'idle' | 'probing' | 'ready' | 'error'>('idle');
  const [mediaProbeError, setMediaProbeError] = useState<string | null>(null);
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
    setSourceVideoFile(file);
    setMediaProbeState('probing');
    setMediaProbeError(null);
    setGenerationState('idle');
    setGenerationError(null);
    setGenerationDiagnostics(null);
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

  const handleExport = async () => {
    if (exportState === 'exporting' || mediaProbeState !== 'ready' || (exportMode === 'full-video' && !sourceVideoFile)) return;
    setExportState('exporting');
    setExportError(null);
    const abortController = new AbortController();
    setExportAbortController(abortController);
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': sourceVideoFile?.type || 'application/octet-stream',
          'X-CueCut-Export-Mode': exportMode,
          'X-CueCut-Filename': encodeURIComponent(sourceVideoFile?.name ?? 'cuecut-overlay.mov'),
          'X-CueCut-Composition': encodeURIComponent(JSON.stringify(project)),
        },
        body: exportMode === 'full-video' ? sourceVideoFile : undefined,
        signal: abortController.signal,
      });
      if (!response.ok) {
        const payload = await response.json() as { message?: string };
        throw new Error(payload.message ?? ('导出失败（HTTP ' + response.status + '）'));
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = exportMode === 'transparent-mov' ? 'cuecut-overlay.mov' : 'cuecut-export.mp4';
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

  const handleCancelExport = () => exportAbortController?.abort();

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
        <input accept="video/*" className="file-input" data-testid="video-input" id="video-input" onChange={handleVideoImport} type="file" />
        <label className="btn" htmlFor="video-input">导入视频</label>
        <span className="file-name">{project.project.video.sourceFileName ?? '未导入视频'}</span>
        <button className="btn primary" disabled={!sourceVideoFile || mediaProbeState !== 'ready' || generationState === 'generating' || generationState === 'success'} onClick={() => void handleGenerateEffects()} type="button">
          {generationState === 'generating' ? '生成中…' : generationState === 'success' ? generationDiagnostics?.usedFallback ? '已载入（本地回退）' : '已生成并载入' : '开始生成动效'}
        </button>
        {generationState === 'generating' && <span className="tiny" data-testid="generation-status">提取音频 → ASR → Director → Workspace</span>}
        {generationState === 'success' && generationDiagnostics?.usedFallback && <span className="tiny error" data-testid="generation-fallback">⚠ 已使用本地回退，结果已载入（非 Director 成功）</span>}
        {generationState === 'success' && <span className="tiny" data-testid="generation-status">{generationDiagnostics?.usedFallback ? '已载入 Workspace · 非 Director 成功' : '已载入 Workspace'}</span>}
        {generationState === 'success' && generationDiagnostics && generationDiagnostics.warnings.length > 0 && <span className="tiny error" data-testid="generation-warnings">警告：{generationDiagnostics.warnings.join('；')}</span>}
        {generationError && <span className="tiny error" role="alert">{generationError}</span>}
        {mediaProbeError && <span className="tiny error" role="alert">{mediaProbeError}</span>}
        <button className="btn" disabled={store.undoDepth() === 0} onClick={() => store.undo()} type="button">↶</button>
        <button className="btn" disabled={store.redoDepth() === 0} onClick={() => store.redo()} type="button">↷</button>
        <select aria-label="导出模式" className="search export-mode" value={exportMode} onChange={(event) => setExportMode(event.target.value as typeof exportMode)}>
          <option value="full-video">MP4 · 完整视频</option>
          <option value="transparent-mov">MOV · 透明叠加</option>
        </select>
        <button className="btn primary" disabled={exportState === 'exporting' || mediaProbeState !== 'ready' || (exportMode === 'full-video' && !sourceVideoFile)} onClick={() => void handleExport()} type="button">
          {exportState === 'exporting' ? '导出中…' : '导出'}
        </button>
        {exportState === 'exporting' && <button className="btn" onClick={handleCancelExport} type="button">取消导出</button>}
        {exportState === 'success' && <span className="tiny" data-testid="export-status">已生成本地文件</span>}
        {exportError && <span className="tiny error" role="alert">{exportError}</span>}
        <RealtimeCapturePanel
          enabled={realtimeEnabled}
          state={realtimeState}
          result={realtimeResult}
          error={realtimeError}
          onStart={(durationSec) => void handleRealtimeCapture(durationSec)}
          onCancel={() => realtimeController.cancel()}
          onDownload={() => { if (realtimeResult) createRealtimeCaptureDownload(realtimeResult); }}
        />
        <button className="btn" onClick={handleSaveProject} type="button">保存</button>
        <button className="btn" onClick={handleContinueProject} type="button">继续</button>
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
          {view === 'edit' && <EditView project={project} store={store} currentTime={clockSnapshot.currentTime} selectedEffectId={selectedEffectId} videoSrc={videoSrc} playing={clockSnapshot.playing} onSelect={onSelect} onSeek={onSeek} subtitleItems={project.subtitles} onSubtitleItemsChange={(items) => store.setSubtitles(items)} onVideoMetadata={() => undefined} onOpenLab={() => setView('lab')} />}
          {view === 'lab' && <EffectLabView project={project} store={store} selectedEffectId={selectedEffectId} onClose={() => setView('edit')} />}
          {view === 'sfx' && <SfxLibrary store={store} selectedEffectId={selectedEffectId} />}
          {view === 'learn' && <LearnView />}
        </div>
      </section>
      <Timeline project={project} store={store} currentTime={clockSnapshot.currentTime} onSeek={onSeek} />
    </div>
  );
}
