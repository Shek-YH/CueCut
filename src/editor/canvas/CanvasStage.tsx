import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { ProjectComposition } from '../../project/schema';
import type { ProjectStore } from '../../project/store';

interface CanvasStageProps {
  project: ProjectComposition;
  currentTime: number;
  selectedEffectId: string;
  videoSrc: string | null;
  store: ProjectStore;
  playing: boolean;
  onVideoTime: (timeSec: number) => void;
  onVideoMetadata: (metadata: { durationSec: number; fps: number; canvasWidth: number; canvasHeight: number }) => void;
  onSelect: (effectId: string) => void;
}

const names: Record<string, string> = {
  'fx-ring': 'Ring A · Spring In',
  'fx-quote': 'Quote B · Slide Left',
  'fx-compare': 'Compare A · Fly Right',
};

export function CanvasStage({ project, currentTime, selectedEffectId, videoSrc, store, playing, onVideoTime, onVideoMetadata, onSelect }: CanvasStageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
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
    if (!video || !videoSrc || Math.abs(video.currentTime - currentTime) < 0.08) return;
    try {
      video.currentTime = currentTime;
    } catch {
      // Ignore seeks before metadata is ready; the next clock update retries.
    }
  }, [currentTime, videoSrc]);

  const beginDrag = (event: ReactPointerEvent<HTMLButtonElement>, effectId: string, mode: 'move' | 'resize' = 'move') => {
    event.stopPropagation();
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
          {videoSrc ? <video ref={videoRef} className="vbg-video" data-testid="preview-video" preload="metadata" src={videoSrc} playsInline onLoadedMetadata={(event) => onVideoMetadata({ durationSec: event.currentTarget.duration, fps: project.project.fps, canvasWidth: event.currentTarget.videoWidth, canvasHeight: event.currentTarget.videoHeight })} onTimeUpdate={(event) => onVideoTime(event.currentTarget.currentTime)} /> : <div className="vbg" />}
          <span className="vlabel">VIDEO FRAME · {currentTime.toFixed(2)}s</span>
          <div className="person" />
          <div className="safe" />
          {project.effects.map((effect) => {
            const isActive = currentTime >= effect.time.startSec && currentTime <= effect.time.endSec;
            const selected = effect.effectId === selectedEffectId;
            const isRing = effect.effectId === 'fx-ring';
            const position = preview[effect.effectId] ?? effect.layout;
            return (
              <button
                className={'fx ' + effect.familyId + (isActive ? '' : ' off') + (selected ? ' sel' : '')}
                data-testid={'effect-card-' + effect.effectId}
                key={effect.effectId}
                onClick={() => onSelect(effect.effectId)}
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
                }}
                type="button"
              >
                <span className="fxtag">{names[effect.effectId] ?? effect.familyId}</span>
                {isRing ? (
                  <>
                    <span className="circle">{String(effect.content.value ?? '92.4')}</span>
                    <span className="card-copy">比例指标</span>
                  </>
                ) : (
                  <strong>{String(effect.content.headline ?? '视觉强调')}</strong>
                )}
                <span className="resize-handle top-left" data-testid={'resize-handle-' + effect.effectId + '-top-left'} onPointerDown={(event) => beginResize(event, effect.effectId)} />
                <span className="resize-handle top-right" data-testid={'resize-handle-' + effect.effectId + '-top-right'} onPointerDown={(event) => beginResize(event, effect.effectId)} />
                <span className="resize-handle bottom-left" data-testid={'resize-handle-' + effect.effectId + '-bottom-left'} onPointerDown={(event) => beginResize(event, effect.effectId)} />
                <span className="resize-handle bottom-right" data-testid={'resize-handle-' + effect.effectId + '-bottom-right'} onPointerDown={(event) => beginResize(event, effect.effectId)} />
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
