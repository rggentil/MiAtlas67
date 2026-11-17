import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from './App.tsx';

describe('App', () => {
  it('SET-01 opens on the home screen, in Spanish by default', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('¿A qué jugamos?');
    expect(screen.getByRole('radio', { name: 'Español' })).toBeChecked();
    expect(document.documentElement.lang).toBe('es');
  });

  it('SET-01 switches every visible text to English', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('radio', { name: 'English' }));

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('What shall we play?');
    expect(screen.getByRole('heading', { name: 'Flags' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Capitals' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Shapes' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
  });

  it('GAME-01 a Flags game opens its own screen, and "Volver" goes back home', async () => {
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: /^País → Bandera/ }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('País → Bandera');

    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('¿A qué jugamos?');
  });
});
