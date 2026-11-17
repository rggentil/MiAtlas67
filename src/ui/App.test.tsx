import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from './App.tsx';

describe('App', () => {
  it('SET-01 shows the start page in Spanish by default', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hola MiAtlas67');
    expect(screen.getByText('Banderas, capitales y siluetas del mundo')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Español' })).toBeChecked();
    expect(document.documentElement.lang).toBe('es');
  });

  it('SET-01 switches every visible text to English', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('radio', { name: 'English' }));

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hello MiAtlas67');
    expect(screen.getByText('Flags, capitals and shapes of the world')).toBeInTheDocument();
    expect(screen.getByText('Flags')).toBeInTheDocument();
    expect(screen.getByText('Capitals')).toBeInTheDocument();
    expect(screen.getByText('Shapes')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
  });
});
