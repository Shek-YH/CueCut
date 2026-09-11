import { useState } from 'react';
import { defaultSubtitleSettings, type SubtitleSettings } from '../../project/schema';
import { parseSrt, serializeSrt, type TranscriptSegment } from '../../subtitles/srt';

interface SrtQuickPanelProps {
  currentTime: number;
  onSeek: (timeSec: number) => void;
  items?: TranscriptSegment[];
  onItemsChange?: (items: TranscriptSegment[]) => void;
  subtitleSettings?: SubtitleSettings;
  onSubtitleSettingsChange?: (update: Partial<SubtitleSettings>) => void;
}

export function SrtQuickPanel({ currentTime, onSeek, items: controlledItems, onItemsChange, subtitleSettings: controlledSettings, onSubtitleSettingsChange }: SrtQuickPanelProps) {
  const [localItems, setLocalItems] = useState<TranscriptSegment[]>([]);
  const [localSettings, setLocalSettings] = useState<SubtitleSettings>(defaultSubtitleSettings);
  const items = controlledItems ?? localItems;
  const settings = controlledSettings ?? localSettings;

  const updateItems = (nextItems: TranscriptSegment[]) => {
    if (!controlledItems) setLocalItems(nextItems);
    onItemsChange?.(nextItems);
  };

  const updateSettings = (update: Partial<SubtitleSettings>) => {
    if (!controlledSettings) setLocalSettings((current) => ({ ...current, ...update }));
    onSubtitleSettingsChange?.(update);
  };

  const importSrt = async (file: File) => {
    updateItems(parseSrt(await file.text()));
  };

  const exportSrt = () => {
    const url = URL.createObjectURL(new Blob([serializeSrt(items)], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'cuecut.srt';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="block" data-testid="srt-panel">
      <div className="blockhead">
        <span>SRT</span>
        <span className="srt-actions">
          <button className="text-btn" aria-label={settings.visible ? '隐藏字幕' : '显示字幕'} onClick={() => updateSettings({ visible: !settings.visible })} type="button">
            {settings.visible ? '隐藏' : '显示'}
          </button>
          <input
            accept=".srt,text/plain"
            aria-label="导入SRT"
            className="file-input"
            id="srt-file-input"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importSrt(file);
            }}
            type="file"
          />
          <label className="text-btn" htmlFor="srt-file-input">导入</label>
          <button className="text-btn" onClick={exportSrt} type="button">导出SRT</button>
          <span className="tiny">CLICK TO SEEK</span>
        </span>
      </div>
      <div className="blockscroll">
        <div className="subtitle-settings" data-testid="subtitle-settings">
          <div className="subtitle-settings-title">字幕样式</div>
          <div className="two">
            <label>字号<input aria-label="字号" max="120" min="12" step="1" type="number" value={settings.fontSize} onChange={(event) => updateSettings({ fontSize: Number(event.target.value) })} /></label>
            <label>描边宽度<input aria-label="描边宽度" max="12" min="0" step="0.5" type="number" value={settings.strokeWidth} onChange={(event) => updateSettings({ strokeWidth: Number(event.target.value) })} /></label>
          </div>
          <div className="two">
            <label>文字颜色<input aria-label="文字颜色" type="color" value={settings.color} onChange={(event) => updateSettings({ color: event.target.value })} /></label>
            <label>描边颜色<input aria-label="描边颜色" type="color" value={settings.strokeColor} onChange={(event) => updateSettings({ strokeColor: event.target.value })} /></label>
          </div>
          <div className="two">
            <label>行距<input aria-label="行距" max="2.5" min="0.8" step="0.1" type="number" value={settings.lineHeight} onChange={(event) => updateSettings({ lineHeight: Number(event.target.value) })} /></label>
            <label>字间距<input aria-label="字间距" max="20" min="-10" step="1" type="number" value={settings.letterSpacing} onChange={(event) => updateSettings({ letterSpacing: Number(event.target.value) })} /></label>
          </div>
          <label>字幕位置<select aria-label="字幕位置" value={settings.position} onChange={(event) => updateSettings({ position: event.target.value as SubtitleSettings['position'] })}><option value="top">上方</option><option value="center">居中</option><option value="bottom">下方</option></select></label>
        </div>
        {items.map((item) => {
          const active = currentTime >= item.startSec && currentTime <= item.endSec;
          return (
            <div
              className={'srt' + (active ? ' active' : '')}
              data-testid={'srt-' + item.id}
              key={item.id}
              onClick={(event) => {
                if (event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
                onSeek(item.startSec);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') onSeek(item.startSec);
              }}
            >
              <div className="srttop">
                <span className="srttime">
                  {item.startSec.toFixed(2)} → {item.endSec.toFixed(2)}
                </span>
                <span className="tiny">{item.id === 's-2' ? '3 FX' : item.id === 's-1' ? '2 FX' : '1 FX'}</span>
              </div>
              <div className="two srt-time-fields">
                <label>开始<input aria-label={'SRT ' + item.id + ' 开始时间'} min="0" step="0.01" type="number" value={item.startSec} onChange={(event) => updateTime(item.id, 'startSec', event.target.value)} /></label>
                <label>结束<input aria-label={'SRT ' + item.id + ' 结束时间'} min="0" step="0.01" type="number" value={item.endSec} onChange={(event) => updateTime(item.id, 'endSec', event.target.value)} /></label>
              </div>
              <textarea
                aria-label={'SRT ' + item.id}
                value={item.text}
                onChange={(event) =>
                  updateItems(items.map((entry) => (entry.id === item.id ? { ...entry, text: event.target.value } : entry)))
                }
              />
            </div>
          );
        })}
      </div>
    </section>
  );

  function updateTime(id: string, key: 'startSec' | 'endSec', value: string) {
    const number = Number(value);
    if (!Number.isFinite(number)) return;
    updateItems(items.map((entry) => (entry.id === id ? { ...entry, [key]: number } : entry)));
  }
}
