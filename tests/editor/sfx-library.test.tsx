import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SfxLibrary } from '../../src/editor/sfx/SfxLibrary';
import { createFixtureProject } from '../../src/project/fixtures';
import { createProjectStore } from '../../src/project/store';

describe('SFX Library', () => {
  it('filters the registry to favorites and updates favorite metadata locally', () => {
    render(<SfxLibrary />);

    fireEvent.click(screen.getByRole('button', { name: '★ 收藏' }));
    expect(screen.getAllByText('Soft Pop 03')[0]).toBeVisible();
    expect(screen.getByText('Studio Whoosh 02')).toBeVisible();

    const popRow = screen.getAllByText('Soft Pop 03')[0].closest('.sound');
    expect(popRow).not.toBeNull();
    if (!popRow) return;

    fireEvent.click(within(popRow).getByRole('button', { name: '★' }));
    expect(within(screen.getByRole('main')).queryByText('Soft Pop 03')).not.toBeInTheDocument();
  });

  it('adds locally previewed sounds to the Recent list', () => {
    render(<SfxLibrary />);

    const row = screen.getByText('Glass Ding 01').closest('.sound');
    expect(row).not.toBeNull();
    if (!row) return;
    fireEvent.click(within(row).getByRole('button', { name: '试听 Glass Ding 01' }));
    fireEvent.click(screen.getByRole('button', { name: '最近使用' }));

    expect(within(screen.getByRole('main')).getByText('Glass Ding 01')).toBeVisible();
    expect(within(screen.getByRole('main')).queryByText('Soft Pop 03')).not.toBeInTheDocument();
  });

  it('replaces the selected Effect SFX through one local Store transaction', () => {
    const store = createProjectStore(createFixtureProject());
    render(<SfxLibrary selectedEffectId="fx-ring" store={store} />);

    const row = screen.getByText('Glass Ding 01').closest('.sound');
    expect(row).not.toBeNull();
    if (!row) return;
    fireEvent.click(row);
    fireEvent.click(screen.getByRole('button', { name: '替换当前 Effect 的音效' }));

    expect(store.getSnapshot().effects[0]?.sfx?.sfxId).toBe('glass-ding-01');
    expect(store.undoDepth()).toBe(1);
  });
});
