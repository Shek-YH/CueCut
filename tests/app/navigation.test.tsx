import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../../src/app/App';

describe('CueCut prototype navigation', () => {
  it('keeps the four primary navigation items in prototype order', () => {
    render(<App />);

    const labels = within(screen.getByRole('navigation')).getAllByRole('button').map((button) => button.textContent);

    expect(labels).toEqual(['✦编辑', '◫动效库', '♫音效库', '⌁自进化']);
  });

  it('keeps the Edit page regions and protected video layer visible', () => {
    render(<App />);

    expect(screen.getByTestId('layers-panel')).toBeVisible();
    expect(screen.getByTestId('srt-panel')).toBeVisible();
    expect(screen.getByTestId('canvas-stage')).toBeVisible();
    expect(screen.getByTestId('inspector')).toBeVisible();
    expect(screen.getByTestId('timeline')).toBeVisible();
    expect(screen.getByTestId('video-layer')).toHaveTextContent('原始视频');
    expect(screen.getByTestId('video-layer')).toHaveTextContent('z0');
    expect(screen.getByTestId('video-layer')).toHaveTextContent('🔒');
    expect(screen.queryByText('字幕1')).not.toBeInTheDocument();
  });

  it('renders Special inspector controls before Common controls', () => {
    render(<App />);

    const inspector = screen.getByTestId('inspector').textContent ?? '';

    expect(inspector.indexOf('SPECIAL')).toBeGreaterThanOrEqual(0);
    expect(inspector.indexOf('COMMON')).toBeGreaterThan(inspector.indexOf('SPECIAL'));
  });
  it('keeps the global Timeline visible when switching to other primary pages', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /音效库/ }));
    await waitFor(() => expect(screen.getByTestId('sfx-view')).toBeVisible());

    expect(screen.getByTestId('timeline')).toBeVisible();
  });

  it('seeks to a visible layer effect frame when selecting it and opens that effect in the library', async () => {
    render(<App />);

    fireEvent.click(screen.getByTestId('layer-fx-quote'));
    expect(screen.getByText((_, element) => element?.classList.contains('time') === true && element.textContent?.includes('2.37') === true)).toBeVisible();
    expect(screen.getByTestId('effect-card-fx-quote')).toHaveAttribute('data-motion-phase', 'enter');

    fireEvent.click(screen.getByRole('button', { name: /动效库/ }));
    await waitFor(() => expect(screen.getByTestId('effect-lab')).toBeVisible());
    expect(screen.getByText('quote Family')).toBeVisible();
    expect(screen.getByRole('button', { name: '确认修改' })).toBeVisible();
  });

  it('browses formal pack variants from the effect registry', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /动效库/ }));
    await waitFor(() => expect(screen.getByTestId('registry-effect-library')).toBeVisible());

    expect(screen.getAllByTestId(/^registry-effect-pack:/)).toHaveLength(87);
  });
});
