import { useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import type { ProjectComposition } from '../../project/schema';
import type { ProjectStore } from '../../project/store';
import { evaluateSceneAtTime } from '../../render/scene';
import { fitText, sceneItemBox, textRegionsForSceneItem, type TextRegion } from '../../render/textFit';
import { findEffectDefinition } from '../../effects/registry';
import { previewTimeForEffect } from '../selection/previewTime';

interface CanvasStageProps {
  project: ProjectComposition;
  currentTime: number;
  selectedEffectId: string;
  videoSrc: string | null;
  store: ProjectStore;
  playing: boolean;
  onVideoTime: (timeSec: number) => void;
  onVideoMetadata: (metadata: { durationSec: number; canvasWidth: number; canvasHeight: number }) => void;
  onSelect: (effectId: string) => void;
}

function FittedText({ region, canvasWidth, className }: { region: TextRegion; canvasWidth: number; className?: string }) {
  const fitted = fitText({ text: region.text, maxWidth: region.width, maxHeight: region.height, fontSize: region.fontSize, maxLines: region.maxLines });
  const scale = 100 / canvasWidth;
  return (
    <span
      className={className}
      data-text-overflow={fitted.overflow ? 'true' : 'false'}
      aria-label={fitted.overflow ? '文案超出卡片，已保留完整内容并记录诊断' : undefined}
      style={{
        display: 'block',
        position: 'relative',
        minWidth: 0,
        overflowWrap: 'anywhere',
        width: `${region.width * scale}cqw`,
        height: `${region.height * scale}cqw`,
        fontSize: `${fitted.fontSize * scale}cqw`,
        lineHeight: `${fitted.lineHeight * scale}cqw`,
        fontWeight: region.weight,
        textAlign: region.align,
      }}
    >
      <span className="fit-lines" style={{ display: 'block', width: '100%', height: '100%', overflow: 'hidden' }}>
        {fitted.lines.map((line, index) => <span className="fit-line" key={`${index}-${line}`}>{line}</span>)}
      </span>
    </span>
  );
}

export function CanvasStage({ project, currentTime, selectedEffectId, videoSrc, store, playing, onVideoTime, onVideoMetadata, onSelect }: CanvasStageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const didDragRef = useRef(false);
  const pointerSelectionRef = useRef(false);
  const suppressClickRef = useRef(false);
  const pausedSeekVersionRef = useRef(0);
  const pausedSeekFrameRef = useRef<number | null>(null);
  const pendingPausedSeekRef = useRef<{ targetTime: number } | null>(null);
  const lastCurrentTimeRef = useRef(currentTime);
  const lastPlayingRef = useRef(playing);
  const [drag, setDrag] = useState<{ effectId: string; mode: 'move' | 'resize'; clientX: number; clientY: number; nx: number; ny: number; nw: number; nh: number; width: number; height: number } | null>(null);
  const [preview, setPreview] = useState<Record<string, { nx: number; ny: number; nw: number; nh: number }>>({});

  const setPendingPausedSeek = (targetTime: number) => {
    pendingPausedSeekRef.current = { targetTime };
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc || video.readyState === 0) return;
    try {
      if (playing) {
        const result = video.play();
        if (result) void result.catch(() => undefined);
      } else {
        video.pause();
      }
    } catch {
      // jsdom and some browsers reject media control until user gesture; native controls remain the source of truth.
    }
  }, [playing, videoSrc]);

  useEffect(() => {
    const video = videoRef.current;
    const currentTimeChanged = lastCurrentTimeRef.current !== currentTime;
    const resumedPlaying = !lastPlayingRef.current && playing;
    const pausedAfterPlaying = lastPlayingRef.current && !playing;
    lastCurrentTimeRef.current = currentTime;
    lastPlayingRef.current = playing;
    if (resumedPlaying) pendingPausedSeekRef.current = null;
    const seekVersion = ++pausedSeekVersionRef.current;
    if (pausedSeekFrameRef.current !== null) {
      window.cancelAnimationFrame(pausedSeekFrameRef.current);
      pausedSeekFrameRef.current = null;
    }
    if (!video || !videoSrc || (playing && Math.abs(video.currentTime - currentTime) < 0.08)) return;
    let frameId: number | null = null;
    try {
      video.currentTime = currentTime;
      if (!playing) {
        const targetTime = currentTime;
        if (currentTimeChanged || pausedAfterPlaying) setPendingPausedSeek(targetTime);
        frameId = window.requestAnimationFrame(() => {
          if (pausedSeekVersionRef.current !== seekVersion) return;
          if (pausedSeekFrameRef.current === frameId) pausedSeekFrameRef.current = null;
          const currentVideo = videoRef.current;
          if (!currentVideo || currentVideo !== video) return;
          if (Math.abs(currentVideo.currentTime - targetTime) >= Number.EPSILON) currentVideo.currentTime = targetTime;
        });
        pausedSeekFrameRef.current = frameId;
      }
    } catch {
      // Ignore seeks before metadata is ready; the next clock update retries.
    }
    return () => {
      if (frameId === null) return;
      window.cancelAnimationFrame(frameId);
      if (pausedSeekFrameRef.current === frameId) pausedSeekFrameRef.current = null;
    };
  }, [currentTime, playing, videoSrc]);

  const beginDrag = (event: ReactPointerEvent<HTMLButtonElement>, effectId: string, mode: 'move' | 'resize' = 'move') => {
    event.stopPropagation();
    didDragRef.current = false;
    pointerSelectionRef.current = true;
    const effect = project.effects.find((item) => item.effectId === effectId);
    const canvas = event.currentTarget.closest('.canvas');
    if (!effect || !(canvas instanceof HTMLElement)) return;
    const rect = canvas.getBoundingClientRect();
    if (mode === 'move') event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ effectId, mode, clientX: event.clientX, clientY: event.clientY, nx: effect.layout.nx, ny: effect.layout.ny, nw: effect.layout.nw, nh: effect.layout.nh, width: rect.width, height: rect.height });
    setPreview((current) => ({ ...current, [effectId]: { nx: effect.layout.nx, ny: effect.layout.ny, nw: effect.layout.nw, nh: effect.layout.nh } }));
    onSelect(effectId);
  };

  const beginResize = (event: ReactPointerEvent<HTMLSpanElement>, effectId: string) => {
    event.stopPropagation();
    const card = event.currentTarget.closest('button');
    if (!card) return;
    const syntheticEvent = event as unknown as ReactPointerEvent<HTMLButtonElement>;
    card.setPointerCapture(event.pointerId);
    beginDrag(syntheticEvent, effectId, 'resize');
  };

  const moveDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag) return;
    didDragRef.current = event.clientX !== drag.clientX || event.clientY !== drag.clientY;
    const effect = project.effects.find((item) => item.effectId === drag.effectId);
    if (!effect) return;
    const dx = (event.clientX - drag.clientX) / drag.width;
    const dy = (event.clientY - drag.clientY) / drag.height;
    const next = drag.mode === 'resize'
      ? { nx: drag.nx, ny: drag.ny, nw: Math.max(0.12, Math.min(1 - drag.nx, drag.nw + dx)), nh: Math.max(0.12, Math.min(1 - drag.ny, drag.nh + dy)) }
      : { nx: Math.max(0, Math.min(1 - drag.nw, drag.nx + dx)), ny: Math.max(0, Math.min(1 - drag.nh, drag.ny + dy)), nw: drag.nw, nh: drag.nh };
    setPreview((current) => ({ ...current, [drag.effectId]: next }));
  };

  const finishDrag = () => {
    const wasDragged = didDragRef.current;
    didDragRef.current = false;
    if (wasDragged) {
      pointerSelectionRef.current = false;
      suppressClickRef.current = true;
    }
    if (!drag) return;
    const next = preview[drag.effectId];
    if (next) store.updateEffect(drag.effectId, (effect) => ({ ...effect, layout: { ...effect.layout, ...next } }));
    setDrag(null);
    setPreview({});
  };

  const cancelDrag = () => {
    didDragRef.current = false;
    pointerSelectionRef.current = false;
    suppressClickRef.current = false;
    setDrag(null);
    setPreview({});
  };

  const handleLoadedMetadata = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    onVideoMetadata({ durationSec: event.currentTarget.duration, canvasWidth: event.currentTarget.videoWidth, canvasHeight: event.currentTarget.videoHeight });
    try {
      event.currentTarget.currentTime = currentTime;
    } catch {
      // Ignore seeks before the native media element is ready.
    }
  };

  const selectEffect = (effectId: string, event: ReactMouseEvent<HTMLButtonElement>) => {
    if (suppressClickRef.current && event.detail > 0) {
      suppressClickRef.current = false;
      return;
    }
    suppressClickRef.current = false;
    const wasPointerSelection = pointerSelectionRef.current;
    pointerSelectionRef.current = false;
    if (!wasPointerSelection) onSelect(effectId);
    const effect = project.effects.find((item) => item.effectId === effectId);
    if (effect) {
      const targetTime = previewTimeForEffect({ ...effect.time, fps: project.project.fps });
      if (!playing) setPendingPausedSeek(targetTime);
      onVideoTime(targetTime);
    }
  };

  const handleVideoTime = (timeSec: number) => {
    const pendingTime = pendingPausedSeekRef.current;
    if (!playing && pendingTime !== null) {
      if (Math.abs(timeSec - pendingTime.targetTime) < 0.001) {
        pendingPausedSeekRef.current = null;
      } else {
        return;
      }
    }
    onVideoTime(timeSec);
  };

  const scene = evaluateSceneAtTime(project, currentTime);

  return (
    <main className="stage" data-testid="canvas-stage">
      <div className="stagebar">
        <span>Canvas · AI 初稿已包含 Variant / Motion / Color / SFX</span>
        <span className="stage-status">
          FRAME {Math.round(currentTime * project.project.fps).toString().padStart(4, '0')} ·{' '}
          {project.effects.filter((effect) => currentTime >= effect.time.startSec && currentTime <= effect.time.endSec).length} FX active
        </span>
      </div>
      <div className="canvaswrap">
        <div className="canvas" data-aspect-ratio={project.project.aspectRatio} style={{ aspectRatio: project.project.aspectRatio.replace(':', ' / ') }}>
          {videoSrc ? <video ref={videoRef} className="vbg-video" data-testid="preview-video" preload="metadata" src={videoSrc} playsInline onLoadedMetadata={handleLoadedMetadata} onTimeUpdate={(event) => handleVideoTime(event.currentTarget.currentTime)} /> : <div className="vbg" />}
          <span className="vlabel">VIDEO FRAME · {currentTime.toFixed(2)}s</span>
          <div className="person" />
          <div className="safe" />
          {project.effects.map((effect) => {
            const sceneItem = scene.items.find((item) => item.effectId === effect.effectId);
            const isActive = sceneItem?.visible ?? false;
            const selected = effect.effectId === selectedEffectId;
            const isMetric = sceneItem?.visualKind === 'metric';
            const position = preview[effect.effectId] ?? effect.layout;
            const positionedItem = sceneItem ? { ...sceneItem, layout: { ...sceneItem.layout, ...position } } : null;
            const box = positionedItem ? sceneItemBox(positionedItem, project.project.canvasWidth, project.project.canvasHeight) : { x: position.nx * project.project.canvasWidth, y: position.ny * project.project.canvasHeight, width: position.nw * project.project.canvasWidth, height: position.nh * project.project.canvasHeight };
            const textRegions = positionedItem ? textRegionsForSceneItem(positionedItem, box.width, box.height) : [];
            const definition = findEffectDefinition(effect.familyId, effect.variantId);
            return (
              <button
                className={'fx visual-' + (sceneItem?.visualKind ?? 'text') + ' ' + effect.familyId + (isActive ? '' : ' off') + (selected ? ' sel' : '')}
                data-motion-phase={sceneItem?.phase ?? 'hidden'}
                data-testid={'effect-card-' + effect.effectId}
                key={effect.effectId}
                onClick={(event) => selectEffect(effect.effectId, event)}
                onPointerDown={(event) => beginDrag(event, effect.effectId)}
                onPointerMove={moveDrag}
                onPointerUp={finishDrag}
                onPointerCancel={cancelDrag}
                style={{
                  left: box.x / project.project.canvasWidth * 100 + '%',
                  top: box.y / project.project.canvasHeight * 100 + '%',
                  width: box.width / project.project.canvasWidth * 100 + '%',
                  height: box.height / project.project.canvasHeight * 100 + '%',
                  zIndex: effect.zIndex,
                  opacity: sceneItem?.opacity ?? 0,
                  filter: sceneItem?.blur ? `blur(${sceneItem.blur}px)` : undefined,
                  transform: sceneItem ? `scale(${sceneItem.scale}) rotate(${sceneItem.rotation}deg)` : undefined,
                }}
                type="button"
              >
                <span className="fxtag">{definition?.displayName ?? effect.familyId}</span>
                {isMetric ? (
                  <>
                    <span className="circle"><FittedText canvasWidth={project.project.canvasWidth} className="fit-value" region={textRegions[0]!} /></span>
                    <span className="card-copy"><FittedText canvasWidth={project.project.canvasWidth} className="fit-label" region={textRegions[1]!} /></span>
                  </>
                ) : (
                  <strong className="card-content">{textRegions[0] ? <FittedText canvasWidth={project.project.canvasWidth} region={textRegions[0]} /> : null}</strong>
                )}
                <span className="resize-handle top-left" data-testid={'resize-handle-' + effect.effectId + '-top-left'} onPointerDown={(event) => beginResize(event, effect.effectId)} />
                <span className="resize-handle top-right" data-testid={'resize-handle-' + effect.effectId + '-top-right'} onPointerDown={(event) => beginResize(event, effect.effectId)} />
                <span className="resize-handle bottom-left" data-testid={'resize-handle-' + effect.effectId + '-bottom-left'} onPointerDown={(event) => beginResize(event, effect.effectId)} />
                <span className="resize-handle bottom-right" data-testid={'resize-handle-' + effect.effectId + '-bottom-right'} onPointerDown={(event) => beginResize(event, effect.effectId)} />
              </button>
            );
          })}
          {scene.items.filter((item) => item.variantId === 'subtitle' && item.visible).map((subtitle) => (
            <div
              className="canvas-subtitle"
              data-testid={'canvas-subtitle-' + subtitle.effectId}
              key={subtitle.effectId}
              style={{ left: subtitle.layout.nx * 100 + '%', top: subtitle.layout.ny * 100 + '%', width: subtitle.layout.nw * 100 + '%', height: subtitle.layout.nh * 100 + '%', opacity: subtitle.opacity, zIndex: subtitle.zIndex }}
            >
              {subtitle.content.kind === 'text' ? subtitle.content.text : ''}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
