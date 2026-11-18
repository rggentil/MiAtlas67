import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App.tsx';
import { HOME_ENTRIES } from './navigation/backContext.ts';

/** The browser's Back, as the phone's back button does it: the popstate event comes a moment later. */
function pressBack(): void {
  window.history.back();
}

const heading = () => screen.getByRole('heading', { level: 1 });

/** Lets every pending effect run before a negative check, so it does not depend on React's scheduling. */
async function settle(): Promise<void> {
  await act(() => Promise.resolve());
}

/** A tap in the game that stays on the home screen: the title. */
async function tapTheTitle(): Promise<void> {
  await userEvent.click(heading());
}

describe('App · Back on the home screen asks first (NAV-02)', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/?seed=42');
  });
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  it('NAV-02 opening the game adds no history entry before the first tap; the first tap adds one', async () => {
    const pushState = vi.spyOn(window.history, 'pushState');
    render(<App />);
    expect(pushState).not.toHaveBeenCalled();

    await tapTheTitle();

    expect(pushState).toHaveBeenCalledTimes(HOME_ENTRIES);
    expect(window.history.state).toEqual({ miatlas: HOME_ENTRIES });
  });

  it('NAV-02 after a tap, Back asks "¿Salir del juego?" with "Pulsa atrás otra vez para salir." and one button, "Seguir jugando"', async () => {
    render(<App />);
    await tapTheTitle();

    pressBack();

    const dialog = await screen.findByRole('dialog', { name: '¿Salir del juego?' });
    expect(dialog).toHaveAccessibleDescription('Pulsa atrás otra vez para salir.');
    expect(
      within(dialog)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['Seguir jugando']);
    expect(within(dialog).getByRole('button', { name: 'Seguir jugando' })).toHaveFocus();
    expect(heading()).toHaveTextContent('¿A qué jugamos?');
  });

  it('NAV-02 Back never adds a history entry by itself: from the question, Back again leaves', async () => {
    render(<App />);
    await tapTheTitle();
    const pushState = vi.spyOn(window.history, 'pushState');

    pressBack();
    await screen.findByRole('dialog', { name: '¿Salir del juego?' });
    await settle();

    expect(pushState).not.toHaveBeenCalled();
    expect(window.history.state).toBeNull();
  });

  it('NAV-02 "Seguir jugando" closes the question, the title takes the focus, and Back asks again', async () => {
    render(<App />);
    await tapTheTitle();
    pressBack();
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Seguir jugando' }),
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(heading()).toHaveFocus();
    expect(window.history.state).toEqual({ miatlas: HOME_ENTRIES });

    pressBack();
    expect(await screen.findByRole('dialog', { name: '¿Salir del juego?' })).toBeVisible();
  });

  it('NAV-02 Escape closes the question too', async () => {
    render(<App />);
    await tapTheTitle();
    pressBack();
    await screen.findByRole('dialog');
    const pushState = vi.spyOn(window.history, 'pushState');

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(heading()).toHaveFocus();
    // Escape is not a tap for the browser, so it adds no entry: Back then leaves without asking (D20).
    await settle();
    expect(pushState).not.toHaveBeenCalled();
    expect(window.history.state).toBeNull();
  });

  it('NAV-02 a tap in the open question, not on "Seguir jugando", adds no entry: Back still leaves', async () => {
    render(<App />);
    await tapTheTitle();
    pressBack();
    const dialog = await screen.findByRole('dialog', { name: '¿Salir del juego?' });
    const pushState = vi.spyOn(window.history, 'pushState');

    await userEvent.click(within(dialog).getByText('Pulsa atrás otra vez para salir.'));
    await userEvent.tab();
    await settle();

    expect(pushState).not.toHaveBeenCalled();
    expect(window.history.state).toBeNull();
    expect(screen.getByRole('dialog', { name: '¿Salir del juego?' })).toBeVisible();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Seguir jugando' }));
    expect(pushState).toHaveBeenCalledTimes(HOME_ENTRIES);
    expect(window.history.state).toEqual({ miatlas: HOME_ENTRIES });
  });

  it('NAV-02 SET-01 NFR-06 the question speaks English when English is chosen', async () => {
    localStorage.setItem('miatlas67.language', 'en');
    render(<App />);
    await tapTheTitle();

    pressBack();

    const dialog = await screen.findByRole('dialog', { name: 'Leave the game?' });
    expect(dialog).toHaveAccessibleDescription('Press Back again to leave.');
    expect(within(dialog).getByRole('button', { name: 'Keep playing' })).toHaveFocus();
  });

  it('NAV-02 the page behind the question does nothing while it is open', async () => {
    render(<App />);
    await tapTheTitle();
    pressBack();
    await screen.findByRole('dialog');

    expect(
      screen.getByRole('button', { name: /^Bandera → País/, hidden: true }).closest('[inert]'),
    ).not.toBeNull();
  });
});
