import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renderApp, renderAppAsLucia } from '../test/app.tsx';

const heading = () => screen.getByRole('heading', { level: 1 });

/** The browser's Back, as the phone's back button does it: the popstate event comes a moment later. */
function pressBack(): void {
  window.history.back();
}

async function openAbout(): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name: 'Acerca de' }));
  expect(heading()).toHaveTextContent('Acerca de');
}

describe('App · "Acerca de" (D33)', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/?seed=42');
  });
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('NAV-01 from the home screen: "Volver" and Back go back to the home screen', async () => {
    await renderAppAsLucia();
    expect(heading()).toHaveTextContent('¿A qué jugamos?');

    await openAbout();
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(heading()).toHaveTextContent('¿A qué jugamos?');

    await openAbout();
    pressBack();
    await waitFor(() => {
      expect(heading()).toHaveTextContent('¿A qué jugamos?');
    });
  });

  it('NAV-01 NAV-02 before choosing a player: "Volver" and Back go back to «¿Quién juega?», without asking to leave', async () => {
    await renderApp();
    expect(heading()).toHaveTextContent('¿Quién juega?');

    await openAbout();
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(heading()).toHaveTextContent('¿Quién juega?');

    await openAbout();
    pressBack();
    await waitFor(() => {
      expect(heading()).toHaveTextContent('¿Quién juega?');
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lucía' })).toBeVisible();
  });
});
