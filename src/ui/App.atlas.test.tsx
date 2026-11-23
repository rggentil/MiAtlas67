import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { deviceWith, renderApp, renderAppAsLucia } from '../test/app.tsx';

const heading = () => screen.getByRole('heading', { level: 1 });

/** The browser's Back, as the phone's back button does it: the popstate event comes a moment later. */
function pressBack(): void {
  window.history.back();
}

async function openAtlas(): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name: 'Atlas' }));
  expect(heading()).toHaveTextContent('Atlas');
  expect(screen.getByRole('region', { name: '¿Qué región quieres ver?' })).toBeVisible();
}

describe('App · the Atlas (ATL-01, ATL-02, D34)', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/?seed=42');
  });
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('ATL-02 NAV-01 NAV-02 opens without a player; "Volver" and Back go back to «¿Quién juega?», without asking to leave', async () => {
    await renderApp();
    expect(heading()).toHaveTextContent('¿Quién juega?');

    await openAtlas();
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(heading()).toHaveTextContent('¿Quién juega?');

    await openAtlas();
    pressBack();
    await waitFor(() => {
      expect(heading()).toHaveTextContent('¿Quién juega?');
    });
    expect(screen.queryByRole('dialog', { name: '¿Salir del juego?' })).not.toBeInTheDocument();
  });

  it('NAV-01 from the home screen: Back in a region goes to the regions, and "Volver" then goes home', async () => {
    await renderAppAsLucia();

    await openAtlas();
    await userEvent.click(screen.getByRole('button', { name: 'Oceanía' }));
    pressBack();
    expect(await screen.findByRole('region', { name: '¿Qué región quieres ver?' })).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));

    expect(heading()).toHaveTextContent('¿A qué jugamos?');
  });

  it('ATL-02 browsing several regions scores nothing and saves nothing', async () => {
    const store = await deviceWith();
    await renderApp(store);
    await userEvent.click(screen.getByRole('button', { name: 'Lucía' }));
    const storageBefore = Object.entries(localStorage);
    const playersBefore = await store.players.list();

    await openAtlas();
    for (const region of ['Oceanía', 'Europa', 'Mundo']) {
      await userEvent.click(screen.getByRole('button', { name: region }));
      await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    }
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));

    expect(await store.rounds.listAll()).toEqual([]);
    expect(Object.entries(localStorage)).toEqual(storageBefore);
    expect(await store.players.list()).toEqual(playersBefore);
    await userEvent.click(screen.getByRole('button', { name: 'Historial' }));
    expect(await screen.findByText('Todavía no hay partidas.')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    await userEvent.click(screen.getByRole('button', { name: 'Progreso' }));
    expect(await screen.findByText('0 estrellas en total')).toBeVisible();
  });
});
