import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../../src/app/App';

describe('video preview reliability', () => {
  it('starts a new project preview at zero seconds', () => {
    render(<App />);

    expect(screen.getByText(/0\.00s \/ /)).toBeInTheDocument();
  });
});
