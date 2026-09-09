import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../../src/app/App';

describe('registry-driven Effect Lab preview', () => {
  it('renders a selected non-numeric pack variant from its SceneFrame content', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /动效库/ }));
    fireEvent.click(screen.getByTestId('registry-effect-pack:cuecut-checklist'));

    expect(screen.getByTestId('preview-content')).toBeVisible();
    expect(screen.queryByTestId('preview-ring')).not.toBeInTheDocument();
  });
});
