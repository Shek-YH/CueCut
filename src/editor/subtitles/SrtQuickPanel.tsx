import { useState } from 'react';
import { parseSrt, serializeSrt, type TranscriptSegment } from '../../subtitles/srt';

interface SrtQuickPanelProps {
  currentTime: number;
  onSeek: (timeSec: number) => void;
  items?: TranscriptSegment[];
  onItemsChange?: (items: TranscriptSegment[]) => void;
}

export function SrtQuickPanel({ currentTime, onSeek, items: controlledItems, onItemsChange }: SrtQuickPanelProps) {
  const [localItems, setLocalItems] = useState<TranscriptSegment[]>([]);
  const items = controlledItems ?? localItems;

  const updateItems = (nextItems: TranscriptSegment[]) => {
    if (!controlledItems) setLocalItems(nextItems);
    onItemsChange?.(nextItems);
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
        {items.map((item) => {
          const active = currentTime >= item.startSec && currentTime <= item.endSec;
          return (
            <div
              className={'srt' + (active ? ' active' : '')}
              data-testid={'srt-' + item.id}
              key={item.id}
              onClick={(event) => {
                if (event.target instanceof HTMLTextAreaElement) return;
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
}
