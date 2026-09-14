import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../../src/app/App';
import { createFixtureProject } from '../../src/project/fixtures';
import { evaluateSceneAtTime } from '../../src/render/scene';
import { createEffectRenderSpec, renderSpecSignature } from '../../src/render/effectRenderSpec';

describe('Runtime V2 visual contracts', () => {
  it('keeps the Workspace and Effect Lab preview on the same structural signature', async () => {
    render(<App />);
    const workspace = screen.getByTestId('effect-card-fx-ring');
    const workspaceSignature = workspace.getAttribute('data-render-signature');

    fireEvent.click(screen.getByRole('button', { name: /动效库/ }));
    await waitFor(() => expect(screen.getByTestId('effect-lab')).toBeVisible());

    expect(screen.getByTestId('preview-content')).toHaveAttribute('data-render-signature', workspaceSignature);
  });

  it('keeps Export’s SceneFrame input structurally distinguishable at a fixed time', () => {
    const project = createFixtureProject();
    const frame = evaluateSceneAtTime(project, 6);
    const base = frame.items.find((item) => item.effectId === 'fx-quote')!;
    const items = [
      frame.items.find((item) => item.effectId === 'fx-ring')!,
      { ...base, visualKind: 'list' as const },
      { ...base, visualKind: 'quote' as const },
      { ...base, visualKind: 'chart' as const },
      { ...base, visualKind: 'highlight' as const },
    ];
    const signatures = items.map((item) => renderSpecSignature(createEffectRenderSpec(item)));

    expect(new Set(signatures).size).toBe(5);
  });
});
