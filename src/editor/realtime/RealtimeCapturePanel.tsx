import { useState } from 'react';
import type { CaptureState, RealtimeCaptureResult } from '../../export/realtime/types';

export function RealtimeCapturePanel({
  enabled,
  state,
  result,
  error,
  onStart,
  onCancel,
  onDownload,
}: {
  enabled: boolean;
  state: CaptureState;
  result: Pick<RealtimeCaptureResult, 'fileName' | 'mimeType' | 'health' | 'validation'> | null;
  error: string | null;
  onStart: (durationSec?: number) => void;
  onCancel: () => void;
  onDownload: () => void;
}) {
  const [duration, setDuration] = useState('');
  if (!enabled) return null;
  const running = !['IDLE', 'SUCCESS', 'FAILED', 'CANCELLED'].includes(state);
  return (
    <section className="realtime-capture-panel" data-testid="realtime-capture-panel" aria-label="Realtime Chroma Capture">
      <div>
        <strong>实验：极速抠像</strong>
        <span className="tiny">实时捕获 · WebM fallback</span>
      </div>
      <span className="tiny">状态：{state}</span>
      {!running && <><select aria-label="Benchmark duration" value={duration} onChange={(event) => setDuration(event.target.value)}><option value="">Timeline duration</option><option value="10">10s</option><option value="60">60s</option></select><button className="btn" onClick={() => onStart(duration ? Number(duration) : undefined)} type="button">极速抠像</button></>}
      {running && <button className="btn" onClick={onCancel} type="button">取消捕获</button>}
      {result && <div className="realtime-capture-metrics">
        <span>Capture FPS: {result.health.actualFps.toFixed(1)}</span>
        <span>Dropped Frames: {result.health.droppedFrames}</span>
        <span>Drift: {result.health.maxDriftMs.toFixed(1)}ms</span>
        <span>Wall Clock: {(result.health.wallClockMs / 1000).toFixed(2)}s</span>
        <span>Mime: {result.mimeType}</span>
        {result.validation.ok && <button className="btn" onClick={onDownload} type="button">下载 {result.fileName}</button>}
      </div>}
      {error && <span className="tiny error" role="alert">{error}</span>}
    </section>
  );
}
