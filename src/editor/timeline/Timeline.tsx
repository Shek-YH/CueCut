import { useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { ProjectComposition } from '../../project/schema';
import type { ProjectStore } from '../../project/store';
import { timelineItems } from '../../project/timeline';
import { previewTimeForEffect } from '../selection/previewTime';
import { clampEffectMove, clampEffectTrim, secondsFromTimelineX } from './timeMath';
import { groupEffectsIntoTracks } from './trackLayout';

interface TimelineProps {
  project: ProjectComposition;
  store: ProjectStore;
  currentTime: number;
  onSelect?: (effectId: string) => void;
  onSeek: (timeSec: number) => void;
}

type DragState = {
  effectId: string;
  mode: 'move' | 'start' | 'end';
  clientX: number;
  clientY: number;
  startSec: number;
  endSec: number;
  width: number;
};

export function Timeline({ project, store, currentTime, onSelect, onSeek }: TimelineProps) {
  const [zoom, setZoom] = useState(1);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [preview, setPreview] = useState<Record<string, { startSec: number; endSec: number }>>({});
  const [scrubbing, setScrubbing] = useState(false);
  const didDragRef = useRef(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const ticks = useMemo(() => Array.from({ length: 16 }, (_, index) => index * 2), []);
  const canonicalItems = timelineItems(project);
  const subtitleItems = canonicalItems.filter((item) => item.type === 'SUBTITLE');
  const sfxItems = canonicalItems.filter((item) => item.type === 'SFX');
  const videoItem = canonicalItems.find((item) => item.type === 'VIDEO');
  const effectTracks = groupEffectsIntoTracks(project.effects.map((effect) => ({ ...effect, time: preview[effect.effectId] ?? effect.time })));
  const toPercent = (value: number) => value / project.project.durationSec * 100;
  const seekFromEvent = (event: ReactPointerEvent<HTMLElement>) => {
    const rect = contentRef.current?.getBoundingClientRect();
    if (!rect) return;
    onSeek(secondsFromTimelineX({
      clientX: event.clientX,
      left: rect.left,
      width: rect.width,
      durationSec: project.project.durationSec,
    }));
  };

  const beginEffectDrag = (
    event: ReactPointerEvent<HTMLElement>,
    effectId: string,
    mode: DragState['mode'],
  ) => {
    event.stopPropagation();
    didDragRef.current = false;
    const effect = project.effects.find((item) => item.effectId === effectId);
    const content = contentRef.current;
    if (!effect || !content) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = content.getBoundingClientRect();
    setDrag({
      effectId,
      mode,
      clientX: event.clientX,
      clientY: event.clientY,
      startSec: effect.time.startSec,
      endSec: effect.time.endSec,
      width: rect.width,
    });
    setPreview((current) => ({
      ...current,
      [effectId]: { startSec: effect.time.startSec, endSec: effect.time.endSec },
    }));
  };

  const moveEffectDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    didDragRef.current = event.clientX !== drag.clientX || event.clientY !== drag.clientY;
    const deltaSec = (event.clientX - drag.clientX) / drag.width * project.project.durationSec;
    const next = drag.mode === 'move'
      ? clampEffectMove({ startSec: drag.startSec, endSec: drag.endSec, deltaSec, durationSec: project.project.durationSec })
      : clampEffectTrim({
          startSec: drag.startSec,
          endSec: drag.endSec,
          edge: drag.mode === 'start' ? 'start' : 'end',
          deltaSec,
          minimumDurationSec: 0.8,
          durationSec: project.project.durationSec,
        });
    setPreview((current) => ({ ...current, [drag.effectId]: next }));
  };

  const finishEffectDrag = () => {
    if (!drag) return;
    const next = preview[drag.effectId];
    if (next) {
      store.updateEffect(drag.effectId, (effect) => ({ ...effect, time: next }));
    }
    setDrag(null);
    setPreview({});
  };

  const cancelEffectDrag = () => {
    didDragRef.current = false;
    setDrag(null);
    setPreview({});
    setScrubbing(false);
  };

  const selectEffect = (effectId: string) => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    const effect = project.effects.find((item) => item.effectId === effectId);
    if (!effect) return;
    onSelect?.(effectId);
    const range = preview[effectId] ?? effect.time;
    onSeek(previewTimeForEffect({ ...range, fps: project.project.fps }));
  };

  return (
    <section className="timeline" data-testid="timeline">
      <div className="tlbar">
        <strong>时间轴</strong>
        <span className="tiny">Playhead 与 Effect Timing 独立</span>
        <span className="tlspacer" />
        <button className="btn" onClick={() => setZoom(1)} type="button">Fit</button>
        <button className="btn" onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))} type="button">−</button>
        <input
          aria-label="时间轴缩放"
          className="zrange"
          max="400"
          min="50"
          onChange={(event) => setZoom(Number(event.target.value) / 100)}
          type="range"
          value={zoom * 100}
        />
        <button className="btn" onClick={() => setZoom((value) => Math.min(4, value + 0.25))} type="button">＋</button>
        <span className="toolval">{Math.round(zoom * 100)}%</span>
      </div>
      <div className="tlbody">
        <div className="labels">
          {[...effectTracks.map((_, index) => `FX${index + 1}`), 'SFX', 'SUB', 'VIDEO 🔒'].map((label) => (
            <div className={'tlabel' + (label === 'VIDEO 🔒' ? ' video' : '')} key={label}>{label}</div>
          ))}
        </div>
        <div className="viewport" ref={viewportRef}>
          <div
            className="content"
            ref={contentRef}
            onPointerDown={(event) => {
              if ((event.target as HTMLElement).closest('.clip') || (event.target as HTMLElement).closest('.phit')) return;
              setScrubbing(true);
              event.currentTarget.setPointerCapture(event.pointerId);
              seekFromEvent(event);
            }}
            onPointerMove={(event) => {
              if (scrubbing) seekFromEvent(event);
              moveEffectDrag(event);
            }}
            onPointerUp={() => {
              setScrubbing(false);
              finishEffectDrag();
            }}
            onPointerCancel={() => {
              cancelEffectDrag();
            }}
            style={{ width: Math.max(100, zoom * 100) + '%' }}
          >
            <div className="ruler">
              {ticks.map((tick) => (
                <span className="tick" key={tick} style={{ left: toPercent(tick) + '%' }}>{tick}s</span>
              ))}
            </div>
            {effectTracks.map((track, trackIndex) => (
              <div className="track" data-testid={'track-effects-' + trackIndex} key={'effect-track-' + trackIndex}>
                {track.map((effect, effectIndex) => {
                  const range = preview[effect.effectId] ?? effect.time;
                  return (
                    <div
                      aria-label={effect.effectId + ' effect clip'}
                      className={'clip ' + effect.familyId}
                      key={effect.effectId}
                      onClick={() => selectEffect(effect.effectId)}
                      onPointerDown={(event) => beginEffectDrag(event, effect.effectId, 'move')}
                      style={{ left: toPercent(range.startSec) + '%', width: toPercent(range.endSec - range.startSec) + '%' }}
                    >
                      <span
                        className="handle left"
                        onPointerDown={(event) => {
                          event.stopPropagation();
                          beginEffectDrag(event, effect.effectId, 'start');
                        }}
                      />
                      {effect.familyId} {effectIndex + 1}
                      <button aria-label={`${effect.effectId} duplicate`} className="clip-action" onClick={(event) => { event.stopPropagation(); store.duplicateEffect(effect.effectId); }} type="button">⧉</button>
                      <button aria-label={`${effect.effectId} delete`} className="clip-action" onClick={(event) => { event.stopPropagation(); store.deleteEffect(effect.effectId); }} type="button">×</button>
                      <span
                        className="handle right"
                        onPointerDown={(event) => {
                          event.stopPropagation();
                          beginEffectDrag(event, effect.effectId, 'end');
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
            <div className="track">
              {sfxItems.map((item) => <div className="clip sfx" key={item.id} style={{ left: toPercent(item.startSec) + '%', width: toPercent(item.endSec - item.startSec) + '%' }}>{item.sfxId}<button aria-label={`${item.id} delete`} className="clip-action" onClick={(event) => { event.stopPropagation(); store.deleteSoundEvent(item.id); }} type="button">×</button></div>)}
            </div>
            <div className="track">
              {subtitleItems.map((item, index) => <div className="clip sub" key={item.id} style={{ left: toPercent(item.startSec) + '%', width: toPercent(item.endSec - item.startSec) + '%' }}>字幕 {index + 1}<button aria-label={`${item.id} duplicate`} className="clip-action" onClick={(event) => { event.stopPropagation(); store.duplicateSubtitle(item.id); }} type="button">⧉</button><button aria-label={`${item.id} delete`} className="clip-action" onClick={(event) => { event.stopPropagation(); store.deleteSubtitle(item.id); }} type="button">×</button></div>)}
            </div>
            <div className="track"><div className="videobar">{videoItem?.label ?? '原始视频'} · Layer 0</div></div>
            <div className="playhead" style={{ left: toPercent(currentTime) + '%' }} />
            <div
              aria-label="播放头"
              className="phit"
              onPointerDown={(event) => {
                event.stopPropagation();
                event.currentTarget.setPointerCapture(event.pointerId);
                setScrubbing(true);
              }}
              onPointerMove={(event) => {
                if (scrubbing) seekFromEvent(event);
              }}
              onPointerUp={() => setScrubbing(false)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
