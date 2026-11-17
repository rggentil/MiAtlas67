import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from './App.tsx';

function heading(): HTMLElement {
  return screen.getByRole('heading', { level: 1 });
}

describe('App', () => {
  it('SET-01 opens on the home screen, in Spanish by default', () => {
    render(<App />);
    expect(heading()).toHaveTextContent('¿A qué jugamos?');
    expect(screen.getByRole('radio', { name: 'Español' })).toBeChecked();
    expect(document.documentElement.lang).toBe('es');
  });

  it('SET-01 switches the home screen to English', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('radio', { name: 'English' }));

    expect(heading()).toHaveTextContent('What shall we play?');
    expect(screen.getByRole('heading', { name: 'Flags' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Capitals' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Shapes' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
  });

  it('GAME-01 a Flags game opens its own screen, and "Volver" goes back home', async () => {
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: /^País → Bandera/ }));
    expect(heading()).toHaveTextContent('País → Bandera');

    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(heading()).toHaveTextContent('¿A qué jugamos?');
  });

  it('NFR-05 the title of each new screen takes the focus', async () => {
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: /^Bandera → País/ }));
    expect(heading()).toHaveTextContent('Bandera → País');
    expect(heading()).toHaveFocus();

    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(heading()).toHaveTextContent('¿A qué jugamos?');
    expect(heading()).toHaveFocus();
  });

  it('LVL-01 choosing region Europa and level Fácil starts a Flags round of Europa · Fácil', async () => {
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: /^Bandera → País/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Europa' }));
    await userEvent.click(screen.getByRole('button', { name: 'Fácil' }));

    const settings = screen.getByRole('list', { name: 'Esta partida' });
    expect(
      within(settings)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Banderas', 'Europa', 'Fácil']);
    expect(screen.getByRole('progressbar', { name: 'Progreso de la partida' })).toHaveAttribute(
      'aria-valuenow',
      '1',
    );
    expect(screen.getByText('1/10')).toBeVisible();
  });
});
