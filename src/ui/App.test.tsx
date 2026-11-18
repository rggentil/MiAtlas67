import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renderApp, renderAppAsLucia } from '../test/app.tsx';

function heading(): HTMLElement {
  return screen.getByRole('heading', { level: 1 });
}

function roundSettings(name: string): (string | null)[] {
  return within(screen.getByRole('list', { name }))
    .getAllByRole('listitem')
    .map((item) => item.textContent);
}

describe('App', () => {
  // A fixed seed, so every run plays the same rounds (NFR-07); jsdom would otherwise pick a random one.
  beforeEach(() => {
    window.history.replaceState(null, '', '/?seed=42');
  });
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('SET-01 PRF-01 opens on "¿Quién juega?", in Spanish by default', async () => {
    await renderApp();
    expect(heading()).toHaveTextContent('¿Quién juega?');
    expect(screen.getByRole('radio', { name: 'Español' })).toBeChecked();
    expect(document.documentElement.lang).toBe('es');
  });

  it('SET-01 switches the home screen to English', async () => {
    await renderAppAsLucia();
    await userEvent.click(screen.getByRole('radio', { name: 'English' }));

    expect(heading()).toHaveTextContent('What shall we play?');
    expect(screen.getByRole('heading', { name: 'Flags' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Capitals' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Shapes' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
  });

  it('GAME-01 a Flags game opens its own screen, and "Volver" goes back home', async () => {
    await renderAppAsLucia();

    await userEvent.click(screen.getByRole('button', { name: /^País → Bandera/ }));
    expect(heading()).toHaveTextContent('País → Bandera');

    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(heading()).toHaveTextContent('¿A qué jugamos?');
  });

  it('NFR-05 the title of each new screen takes the focus', async () => {
    await renderAppAsLucia();

    await userEvent.click(screen.getByRole('button', { name: /^Bandera → País/ }));
    expect(heading()).toHaveTextContent('Bandera → País');
    expect(heading()).toHaveFocus();

    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(heading()).toHaveTextContent('¿A qué jugamos?');
    expect(heading()).toHaveFocus();
  });

  it('LVL-01 choosing region Europa and level Fácil starts a Flags round of Europa · Fácil', async () => {
    await renderAppAsLucia();

    await userEvent.click(screen.getByRole('button', { name: /^Bandera → País/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Europa' }));
    await userEvent.click(screen.getByRole('button', { name: 'Fácil' }));

    expect(heading()).toHaveTextContent('¿De qué país es esta bandera?');
    expect(heading()).toHaveFocus();
    expect(roundSettings('Esta partida')).toEqual(['Banderas', 'Europa', 'Fácil']);
    expect(screen.getByRole('progressbar', { name: 'Progreso de la partida' })).toHaveAttribute(
      'aria-valuenow',
      '1',
    );
    expect(screen.getByText('1/10')).toBeVisible();
  });

  it('LVL-01 the round screen speaks English when English is chosen', async () => {
    await renderAppAsLucia();
    await userEvent.click(screen.getByRole('radio', { name: 'English' }));

    await userEvent.click(screen.getByRole('button', { name: /^Country → Flag/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Europe' }));
    await userEvent.click(screen.getByRole('button', { name: 'Easy' }));

    expect(heading()).toHaveTextContent(/^Which one is the flag of .+\?$/);
    expect(roundSettings('This round')).toEqual(['Flags', 'Europe', 'Easy']);
    expect(screen.getByRole('progressbar', { name: 'Round progress' })).toBeInTheDocument();
  });
});
