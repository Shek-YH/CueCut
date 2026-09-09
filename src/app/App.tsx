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

type ViewId = 'edit' | 'lab' | 'sfx' | 'learn';

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
  return effect.familyId;
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
  onVideoMetadata: (metadata: { durationSec: number; fps: number; canvasWidth: number; canvasHeight: number }) => void;
  onOpenLab: () => void;
}) {
  return (
    <div className="view edit active" data-testid="edit-view">
      <aside className="panel side edit-left">
        <div className="phead">
          <strong>编辑</strong>
          <span className="tiny">LAYERS + SRT</span>
        </div>
        <div className="editgrid">
        <LayersPanel project={project} selectedEffectId={selectedEffectId} onSelect={onSelect} />
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
          <div className="family">
            <div className="familytop">
              <div className="thumb ring" />
              <div>
                <div className="f-title">指标环 Family</div>
                <div className="f-meta">KPI · 比例 · 数据</div>
              </div>
            </div>
            <div className="variants">
              {['ring-a', 'ring-b', 'ring-c'].map((variantId) => (
                <button
                  className={'vbtn' + (draft.variantId === variantId ? ' on' : '')}
                  key={variantId}
                  onClick={() => setDraft((current) => (current ? { ...current, variantId } : current))}
                  type="button"
                >
                  {variantId.replace('ring-', '').toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="family">
            <div className="familytop">
              <div className="thumb quote" />
              <div>
                <div className="f-title">数字强调 Family</div>
                <div className="f-meta">兼容当前内容 · 可无损迁移</div>
              </div>
            </div>
            <div className="variants">
              <button className="vbtn" type="button">Number A</button>
              <button className="vbtn" type="button">Number B</button>
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
            <div className="previewCard">
              <div className="previewRing" style={{ borderColor: draft.appearance.accent, borderLeftColor: '#364154' }}>
                {String(draft.content.value ?? '92.4')}
              </div>
              <div className="previewCopy">
                <b>{String(draft.content.headline ?? '比例指标')}</b>
                <span>圆环注水到这个比例</span>
              </div>
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
            {[
              ['spring-in', 'Spring In', '轻微弹性'],
              ['fly-right', '从右侧飞入', '画面外 → 目标'],
              ['spin-360', '旋转 360°', '旋转 + 缩放'],
              ['spin-720', '旋转 720°', '高强度 · 谨慎'],
              ['pop', 'Pop', '快速强调'],
              ['fade', 'Fade', '克制'],
            ].map(([motionId, title, detail]) => (
              <button className={'motionBtn' + (draft.motion.enter.motionId === motionId ? ' on' : '')} key={motionId} onClick={() => setEnter(motionId)} type="button">
                {title}<small>{detail}</small>
              </button>
            ))}
          </div>
          <div className="field range-field">
            <label htmlFor="enter-duration"><span>入场时长</span><b>{draft.motion.enter.durationSec.toFixed(2)}s</b></label>
            <input id="enter-duration" type="range" min="20" max="120" value={draft.motion.enter.durationSec * 100} onChange={(event) => setDraft((current) => current ? { ...current, motion: { ...current.motion, enter: { ...current.motion.enter, durationSec: Number(event.target.value) / 100 } } } : current)} />
          </div>

          <div className="groupTitle">出场 Exit</div>
          <div className="motionGrid">
            {[
              ['scale-fade-out', 'Scale Fade', 'AI 推荐'],
              ['fly-left', '向左飞出', '离开画面'],
              ['shrink', 'Shrink', '缩小消失'],
              ['spin-out', 'Spin Out', '旋转退场'],
            ].map(([motionId, title, detail]) => (
              <button className={'motionBtn' + (draft.motion.exit.motionId === motionId ? ' on' : '')} key={motionId} onClick={() => setExit(motionId)} type="button">
                {title}<small>{detail}</small>
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
        <div className="metrics"><div className="metric"><b>23</b><span>有效导出样本</span></div><div className="metric"><b>0.041</b><span>坐标误差</span></div><div className="metric"><b>74%</b><span>Motion 保留率</span></div><div className="metric"><b>81%</b><span>SFX 保留率</span></div></div>
        <div className="family"><div className="ititle"><span>Semantic Preference · 坐标热区</span><span className="tiny">9:16 · NUMERIC · SUBJECT CENTER</span></div><div className="heat"><div className="target" /></div><div className="variants"><button className="choice on" type="button">X 0.735</button><button className="choice" type="button">Y 0.182</button><button className="choice" type="button">Scale .91</button><button className="choice" type="button">Confidence .87</button></div></div>
        <div className="family"><div className="ititle"><span>Episodic Memory · 最近成功样本</span><span className="tiny">EXPORT CONFIRMED</span></div><div className="log"><span>09/07</span><span>AI工具教程 · Ring A → B · Fly Right 保留</span><span className="delta">SIM 0.91</span></div><div className="log"><span>09/06</span><span>观点口播 · Quote C · Spring In</span><span className="delta">SIM 0.84</span></div><div className="log"><span>09/04</span><span>教程 · Compare B · Studio Whoosh</span><span className="delta">SIM 0.79</span></div></div>
      </main>
      <aside className="rules"><div className="phead learn-head"><strong>Procedural Rules</strong><span className="tiny">DIRECTOR PROFILE</span></div><div className="rule">9:16 数字卡优先右上，但先避开人物扩展区。<div className="confidence">confidence .88 · 17 samples</div></div><div className="rule">普通解释段减少强旋转；Spin 720 只在高重要度钩子候选中出现。<div className="confidence">confidence .81 · 12 samples</div></div><div className="rule">Studio 风格 SFX 权重高；收藏音效只在 intent 匹配时加权。<div className="confidence">confidence .76 · 14 samples</div></div><div className="rule">目标密度约 8~10 FX/min；连续说明段允许留白。<div className="confidence">confidence .83 · 19 samples</div></div></aside>
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
  const [subtitleItems, setSubtitleItems] = useState<TranscriptSegment[] | null>(null);
  const [generationState, setGenerationState] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [generationError, setGenerationError] = useState<string | null>(null);
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
    setSubtitleItems(null);
    setGenerationState('idle');
    setGenerationError(null);
    setVideoSrc(videoSourceManager.replace(file));
    store.setVideoSourceName(file.name);
  };

  const preferenceProfile = useMemo(
    () => createPreferenceProfile(project.project.aspectRatio, preferenceEngine.all()),
    [preferenceEngine, project.project.aspectRatio],
  );

  const handleGenerateEffects = async () => {
    if (!sourceVideoFile || generationState === 'generating') return;
    setGenerationState('generating');
    setGenerationError(null);
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
      const payload = await response.json() as { message?: string; transcript?: TranscriptSegment[]; composition?: ProjectComposition };
      if (!response.ok || !payload.composition || !payload.transcript) {
        throw new Error(payload.message ?? ('生成失败（HTTP ' + response.status + '）'));
      }
      store.replaceComposition(payload.composition);
      setSubtitleItems(payload.transcript);
      clock.setDuration(payload.composition.project.durationSec, payload.composition.project.fps);
      clock.setTime(0);
      setSelectedEffectId(payload.composition.effects[0]?.effectId ?? '');
      setView('edit');
      setGenerationState('success');
    } catch (error) {
      setGenerationState('error');
      setGenerationError(error instanceof Error ? error.message : '生成失败');
    }
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
        <button className="btn primary" disabled={!sourceVideoFile || generationState === 'generating' || generationState === 'success'} onClick={() => void handleGenerateEffects()} type="button">
          {generationState === 'generating' ? '生成中…' : generationState === 'success' ? '已生成并载入' : '开始生成动效'}
        </button>
        {generationState === 'generating' && <span className="tiny" data-testid="generation-status">提取音频 → ASR → Director → Workspace</span>}
        {generationState === 'success' && <span className="tiny" data-testid="generation-status">已载入 Workspace</span>}
        {generationError && <span className="tiny error" role="alert">{generationError}</span>}
        <button className="btn" disabled={store.undoDepth() === 0} onClick={() => store.undo()} type="button">↶</button>
        <button className="btn" disabled={store.redoDepth() === 0} onClick={() => store.redo()} type="button">↷</button>
        <button className="btn primary" type="button">导出</button>
      </header>
      <section className="workspace">
        <nav className="nav" aria-label="主导航">
          {navItems.map((item) => (
            <button className={'navitem' + (view === item.id ? ' active' : '')} key={item.id} onClick={() => setView(item.id)} type="button">
              <b>{item.icon}</b><span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="views">
          {view === 'edit' && <EditView project={project} store={store} currentTime={clockSnapshot.currentTime} selectedEffectId={selectedEffectId} videoSrc={videoSrc} playing={clockSnapshot.playing} onSelect={onSelect} onSeek={onSeek} subtitleItems={subtitleItems ?? undefined} onSubtitleItemsChange={setSubtitleItems} onVideoMetadata={(metadata) => { store.setVideoMetadata({ sourceFileName: store.getSnapshot().project.video.sourceFileName ?? 'local-video', ...metadata }); clock.setDuration(metadata.durationSec, metadata.fps); }} onOpenLab={() => setView('lab')} />}
          {view === 'lab' && <EffectLabView project={project} store={store} selectedEffectId={selectedEffectId} onClose={() => setView('edit')} />}
          {view === 'sfx' && <SfxLibrary store={store} selectedEffectId={selectedEffectId} />}
          {view === 'learn' && <LearnView />}
        </div>
      </section>
      <Timeline project={project} store={store} currentTime={clockSnapshot.currentTime} onSeek={onSeek} />
    </div>
  );
}
