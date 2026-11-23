import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AVATARS } from '../../domain/players.ts';
import type { Player } from '../../storage/store.ts';
import { renderWithI18n } from '../../test/render.tsx';
import { PlayersScreen } from './PlayersScreen.tsx';

const LUCIA: Player = { id: 1, nickname: 'Lucía', avatar: 'fox' };
const PABLO: Player = { id: 2, nickname: 'Pablo', avatar: 'owl' };

/** `count` players: Jugador 1, Jugador 2… */
function playersOf(count: number): Player[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    nickname: `Jugador ${String(index + 1)}`,
    avatar: AVATARS[index % AVATARS.length] ?? 'fox',
  }));
}

interface Shown {
  players?: readonly Player[] | null;
  lastPlayerId?: number | null;
  onChoose?: (player: Player) => void;
  onNewPlayer?: () => void;
  onEdit?: (player: Player) => void;
  onOpenAbout?: () => void;
}

function renderPlayers({
  players = [LUCIA, PABLO],
  lastPlayerId = null,
  onChoose = vi.fn(),
  onNewPlayer = vi.fn(),
  onEdit = vi.fn(),
  onOpenAbout = vi.fn(),
}: Shown = {}) {
  renderWithI18n(
    <PlayersScreen
      players={players}
      lastPlayerId={lastPlayerId}
      onChoose={onChoose}
      onNewPlayer={onNewPlayer}
      onEdit={onEdit}
      onOpenAbout={onOpenAbout}
    />,
  );
}

/** A player's own button, not its "Editar a …" one. */
const isPlayerName = (name: string) => !name.startsWith('Editar a ');

const newPlayerButton = () => screen.queryByRole('button', { name: 'Nuevo jugador' });

describe('PlayersScreen', () => {
  it('DATA-05 D33 "Acerca de" in the footer, next to "Idioma", opens the credits without a player', async () => {
    const onOpenAbout = vi.fn();
    renderPlayers({ onOpenAbout });

    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByRole('group', { name: 'Idioma' })).toBeVisible();
    await userEvent.click(within(footer).getByRole('button', { name: 'Acerca de' }));

    expect(onOpenAbout).toHaveBeenCalledOnce();
  });

  it('PRF-04 every player has its own "Editar" button, next to it in the list', async () => {
    const onEdit = vi.fn<(player: Player) => void>();
    const onChoose = vi.fn();
    renderPlayers({ onEdit, onChoose });

    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    for (const [index, nickname] of ['Lucía', 'Pablo'].entries()) {
      const item = within(items[index] ?? document.body);
      expect(item.getAllByRole('button')).toEqual([
        item.getByRole('button', { name: nickname }),
        item.getByRole('button', { name: `Editar a ${nickname}` }),
      ]);
    }

    await userEvent.click(screen.getByRole('button', { name: 'Editar a Lucía' }));

    expect(onEdit).toHaveBeenCalledExactlyOnceWith(LUCIA);
    expect(onChoose).not.toHaveBeenCalled();
  });

  it('PRF-04 NFR-06 the "Editar" button speaks English too', async () => {
    renderPlayers();

    await userEvent.click(screen.getByRole('radio', { name: 'English' }));

    expect(screen.getByRole('button', { name: 'Edit Pablo' })).toBeVisible();
  });

  it('PRF-01 the first time on a device, "¿Quién juega?" has only the button "Nuevo jugador"', () => {
    renderPlayers({ players: [] });

    expect(screen.getByRole('heading', { level: 1, name: '¿Quién juega?' })).toBeVisible();
    // The footer holds the settings and "Acerca de" (D33).
    expect(within(screen.getByRole('main')).getAllByRole('button')).toEqual([newPlayerButton()]);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('PRF-01 shows every player of the device by nickname, in the order they were created', () => {
    renderPlayers();

    const list = screen.getByRole('list', { name: 'Jugadores' });
    expect(
      within(list)
        .getAllByRole('button', { name: isPlayerName })
        .map((button) => button.textContent),
    ).toEqual(['Lucía', 'Pablo']);
    expect(newPlayerButton()).toBeVisible();
  });

  it('PRF-01 tapping a player chooses who plays', async () => {
    const onChoose = vi.fn<(player: Player) => void>();
    renderPlayers({ onChoose });

    await userEvent.click(screen.getByRole('button', { name: 'Pablo' }));

    expect(onChoose).toHaveBeenCalledExactlyOnceWith(PABLO);
  });

  it('PRF-02 "Nuevo jugador" opens the form to create one', async () => {
    const onNewPlayer = vi.fn();
    renderPlayers({ onNewPlayer });

    await userEvent.click(screen.getByRole('button', { name: 'Nuevo jugador' }));

    expect(onNewPlayer).toHaveBeenCalledOnce();
  });

  it('PRF-01 NFR-05 the last player is marked with the label "Jugó la última vez", not only by colour', () => {
    renderPlayers({ lastPlayerId: PABLO.id });

    expect(screen.getAllByText('Jugó la última vez')).toHaveLength(1);
    expect(screen.getByText('Jugó la última vez')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Pablo' })).toHaveAccessibleDescription(
      'Jugó la última vez',
    );
    expect(screen.getByRole('button', { name: 'Lucía' })).not.toHaveAccessibleDescription();
    // The label is on Pablo's own item of the list.
    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual(['Lucía', 'PabloJugó la última vez']);
  });

  it('PRF-01 with nobody who played last, no player is marked', () => {
    renderPlayers({ lastPlayerId: null });

    expect(screen.queryByText('Jugó la última vez')).not.toBeInTheDocument();
  });

  it('PRF-05 with 8 players there is no "Nuevo jugador", and a note says that up to 8 fit', () => {
    renderPlayers({ players: playersOf(8) });

    expect(newPlayerButton()).not.toBeInTheDocument();
    expect(screen.getByText('En este dispositivo caben 8 jugadores como mucho.')).toBeVisible();
    expect(
      within(screen.getByRole('list')).getAllByRole('button', { name: isPlayerName }),
    ).toHaveLength(8);
    expect(screen.getAllByRole('button', { name: /^Editar a / })).toHaveLength(8);
  });

  it('PRF-05 with 7 players there is still room for one more', () => {
    renderPlayers({ players: playersOf(7) });

    expect(newPlayerButton()).toBeVisible();
    expect(screen.queryByText(/caben 8 jugadores/)).not.toBeInTheDocument();
  });

  it('PRF-01 while the players are being read, it offers nothing to tap yet', () => {
    renderPlayers({ players: null });

    expect(screen.getByRole('heading', { level: 1, name: '¿Quién juega?' })).toBeVisible();
    expect(within(screen.getByRole('main')).queryAllByRole('button')).toEqual([]);
  });

  it('PRF-01 PRF-05 NFR-06 "¿Quién juega?" speaks English when English is chosen', async () => {
    renderPlayers({ players: playersOf(8), lastPlayerId: 1 });

    await userEvent.click(screen.getByRole('radio', { name: 'English' }));

    expect(screen.getByRole('heading', { level: 1, name: "Who's playing?" })).toBeVisible();
    expect(screen.getByRole('list', { name: 'Players' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Jugador 1' })).toHaveAccessibleDescription(
      'Played last',
    );
    expect(screen.getByText('Up to 8 players fit on this device.')).toBeVisible();
  });

  it('PRF-02 NFR-06 offers "New player" in English', async () => {
    renderPlayers();

    await userEvent.click(screen.getByRole('radio', { name: 'English' }));

    expect(screen.getByRole('button', { name: 'New player' })).toBeVisible();
  });
});
