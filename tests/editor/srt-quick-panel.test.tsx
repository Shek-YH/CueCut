import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SrtQuickPanel } from '../../src/editor/subtitles/SrtQuickPanel';

describe('SRT quick panel', () => {
  it('imports a local SRT file into editable segments', async () => {
    render(<SrtQuickPanel currentTime={0} onSeek={() => undefined} />);
    const file = new File(['1\n00:00:00,000 --> 00:00:01,200\nImported local SRT\n'], 'local.srt', { type: 'text/plain' });

    fireEvent.change(screen.getByLabelText('导入SRT'), { target: { files: [file] } });

    await waitFor(() => expect(screen.getByDisplayValue('Imported local SRT')).toBeVisible());
    expect(screen.getByRole('button', { name: '导出SRT' })).toBeVisible();
  });
});

