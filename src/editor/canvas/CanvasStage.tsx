import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { ProjectComposition } from '../../project/schema';
import type { ProjectStore } from '../../project/store';
import { evaluateSceneAtTime } from '../../render/scene';
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

export function CanvasStage({ project, currentTime, selectedEffectId, videoSrc, store, playing, onVideoTime, onVideoMetadata, onSelect }: CanvasStageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const didDragRef = useRef(false);
  const pointerDownRef = useRef(false);
  const [drag, setDrag] = useState<{ effectId: string; mode: 'move' | 'resize'; clientX: number; clientY: number; nx: number; ny: number; nw: number; nh: number; width: number; height: number } | null>(null);
  const [preview, setPreview] = useState<Record<string, { nx: number; ny: number; nw: number; nh: number }>>({});

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
    if (!video || !videoSrc || (playing && Math.abs(video.currentTime - currentTime) < 0.08)) return;
    try {
      video.currentTime = currentTime;
      if (!playing) {
        const targetTime = currentTime;
        window.requestAnimationFrame(() => {
          const currentVideo = videoRef.current;
          if (!currentVideo || currentVideo !== video || Math.abs(currentVideo.currentTime - targetTime) < Number.EPSILON) return;
          currentVideo.currentTime = targetTime;
        });
      }
    } catch {
      // Ignore seeks before metadata is ready; the next clock update retries.
    }
  }, [currentTime, playing, videoSrc]);

  const beginDrag = (event: ReactPointerEvent<HTMLButtonElement>, effectId: string, mode: 'move' | 'resize' = 'move') => {
    event.stopPropagation();
    didDragRef.current = false;
    pointerDownRef.current = true;
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
    if (!drag) return;
    const next = preview[drag.effectId];
    if (next) store.updateEffect(drag.effectId, (effect) => ({ ...effect, layout: { ...effect.layout, ...next } }));
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

  const selectEffect = (effectId: string) => {
    const wasPointerDown = pointerDownRef.current;
    pointerDownRef.current = false;
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    if (!wasPointerDown) onSelect(effectId);
    const effect = project.effects.find((item) => item.effectId === effectId);
    if (effect) onVideoTime(previewTimeForEffect({ ...effect.time, fps: project.project.fps }));
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
          {videoSrc ? <video ref={videoRef} className="vbg-video" data-testid="preview-video" preload="metadata" src={videoSrc} playsInline onLoadedMetadata={handleLoadedMetadata} onTimeUpdate={(event) => onVideoTime(event.currentTarget.currentTime)} /> : <div className="vbg" />}
          <span className="vlabel">VIDEO FRAME · {currentTime.toFixed(2)}s</span>
          <div className="person" />
          <div className="safe" />
          {project.effects.map((effect) => {
            const sceneItem = scene.items.find((item) => item.effectId === effect.effectId);
            const isActive = sceneItem?.visible ?? false;
            const selected = effect.effectId === selectedEffectId;
            const isNumber = sceneItem?.content.kind === 'number';
            const position = preview[effect.effectId] ?? effect.layout;
            const definition = findEffectDefinition(effect.familyId, effect.variantId);
            return (
              <button
                className={'fx ' + effect.familyId + (isActive ? '' : ' off') + (selected ? ' sel' : '')}
                data-motion-phase={sceneItem?.phase ?? 'hidden'}
                data-testid={'effect-card-' + effect.effectId}
                key={effect.effectId}
                onClick={() => selectEffect(effect.effectId)}
                onPointerDown={(event) => beginDrag(event, effect.effectId)}
                onPointerMove={moveDrag}
                onPointerUp={finishDrag}
                onPointerCancel={finishDrag}
                style={{
                  left: position.nx * 100 + '%',
                  top: position.ny * 100 + '%',
                  width: position.nw * 100 + '%',
                  height: position.nh * 100 + '%',
                  zIndex: effect.zIndex,
                  opacity: sceneItem?.opacity ?? 0,
                  filter: sceneItem?.blur ? `blur(${sceneItem.blur}px)` : undefined,
                  transform: sceneItem ? `translate(${sceneItem.translate.x}px, ${sceneItem.translate.y}px) scale(${sceneItem.scale}) rotate(${sceneItem.rotation}deg)` : undefined,
                }}
                type="button"
              >
                <span className="fxtag">{definition?.displayName ?? effect.familyId}</span>
                {isNumber ? (
                  <>
                    <span className="circle">{String(sceneItem?.content.kind === 'number' ? sceneItem.content.value : effect.content.value ?? '0')}</span>
                    <span className="card-copy">{sceneItem?.content.kind === 'number' ? sceneItem.content.label : ''}</span>
                  </>
                ) : (
                  <strong>{sceneItem?.content.kind === 'text' ? sceneItem.content.text : sceneItem?.content.kind === 'list' ? sceneItem.content.items.join(' · ') : sceneItem?.content.label}</strong>
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
