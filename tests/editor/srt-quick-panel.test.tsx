import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SrtQuickPanel } from '../../src/editor/subtitles/SrtQuickPanel';

describe('SRT quick panel', () => {
  it('imports a local SRT file into editable segments', async () => {
    render(<SrtQuickPanel currentTime={0} onSeek={() => undefined} />);
    const file = new File(['1\n00:00:00,000 --> 00:00:01,200\nImported local SRT\n'], 'local.srt', { type: 'text/plain' });

    fireEvent.change(screen.getByLabelText('导入SRT'), { target: { files: [file] } });

    await waitFor(() => expect(screen.getByDisplayValue('Imported local SRT')).toBeVisible());
    expect(screen.getByRole('button', { name: '导出SRT' })).toBeVisible();
  });

  it('edits subtitle timing and text through the validated callbacks', () => {
    const onItemsChange = vi.fn();
    const onSettingsChange = vi.fn();
    const items = [{ id: 's-1', startSec: 1, endSec: 2, text: 'caption' }];

    render(
      <SrtQuickPanel
        currentTime={1.5}
        items={items}
        onItemsChange={onItemsChange}
        onSeek={() => undefined}
        onSubtitleSettingsChange={onSettingsChange}
        subtitleSettings={{ visible: true, fontSize: 42, color: '#FFFFFF', strokeColor: '#000000', strokeWidth: 2, lineHeight: 1.2, letterSpacing: 0, position: 'bottom' }}
      />,
    );

    fireEvent.change(screen.getByLabelText('SRT s-1'), { target: { value: 'edited' } });
    fireEvent.change(screen.getByLabelText('SRT s-1 开始时间'), { target: { value: '2.5' } });
    fireEvent.change(screen.getByLabelText('SRT s-1 结束时间'), { target: { value: '4' } });

    expect(onItemsChange).toHaveBeenCalledWith([{ id: 's-1', startSec: 1, endSec: 2, text: 'edited' }]);
    expect(onItemsChange).toHaveBeenCalledWith([{ id: 's-1', startSec: 2.5, endSec: 2, text: 'caption' }]);
    expect(onItemsChange).toHaveBeenCalledWith([{ id: 's-1', startSec: 1, endSec: 4, text: 'caption' }]);
  });

  it('exposes subtitle visibility and style controls through the settings callback', () => {
    const onSettingsChange = vi.fn();

    render(
      <SrtQuickPanel
        currentTime={0}
        items={[]}
        onSeek={() => undefined}
        onSubtitleSettingsChange={onSettingsChange}
        subtitleSettings={{ visible: true, fontSize: 42, color: '#FFFFFF', strokeColor: '#000000', strokeWidth: 2, lineHeight: 1.2, letterSpacing: 0, position: 'bottom' }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '隐藏字幕' }));
    fireEvent.change(screen.getByLabelText('字号'), { target: { value: '56' } });
    fireEvent.change(screen.getByLabelText('文字颜色'), { target: { value: '#FF0000' } });
    fireEvent.change(screen.getByLabelText('字幕位置'), { target: { value: 'top' } });

    expect(onSettingsChange).toHaveBeenCalledWith({ visible: false });
    expect(onSettingsChange).toHaveBeenCalledWith({ fontSize: 56 });
    expect(onSettingsChange).toHaveBeenCalledWith({ color: '#ff0000' });
    expect(onSettingsChange).toHaveBeenCalledWith({ position: 'top' });
  });
});
