import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../../src/app/App';

describe('project persistence controls', () => {
  it('saves and continues the current canonical composition', () => {
    localStorage.clear();
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '保存' }));
    expect(screen.getByTestId('project-status')).toHaveTextContent('项目已保存');
    fireEvent.click(screen.getByRole('button', { name: '继续' }));
    expect(screen.getByTestId('project-status')).toHaveTextContent('已继续上次项目');
  });
});
