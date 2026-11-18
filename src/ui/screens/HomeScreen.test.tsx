import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Player } from '../../storage/store.ts';
import type { PlayableGame } from '../games.ts';
import { renderWithI18n } from '../../test/render.tsx';
import { HomeScreen } from './HomeScreen.tsx';

const SOON_GAMES = ['País → Capital', 'Capital → País', 'Silueta → País', 'País → Silueta'];

const LUCIA: Player = { id: 1, nickname: 'Lucía', avatar: 'fox' };

/** A game button, found by the start of its name: "Bandera → País ¿De qué país es?". */
function game(name: string): HTMLElement {
  return screen.getByRole('button', { name: (accessibleName) => accessibleName.startsWith(name) });
}

function renderHome(
  onOpenGame: (game: PlayableGame) => void = vi.fn(),
  player = LUCIA,
  onSwitchPlayer: () => void = vi.fn(),
) {
  renderWithI18n(
    <HomeScreen
      player={player}
      onOpenGame={onOpenGame}
      onSwitchPlayer={onSwitchPlayer}
      onBack={vi.fn()}
    />,
  );
}

describe('HomeScreen', () => {
  it('PRF-03 the player "Lucía" is a button, described as "Cambiar de jugador", that switches player', async () => {
    const onSwitchPlayer = vi.fn();
    renderHome(vi.fn(), LUCIA, onSwitchPlayer);

    const button = within(screen.getByRole('group', { name: 'Jugador' })).getByRole('button');
    expect(button).toHaveAccessibleName('Lucía');
    expect(button).toHaveAccessibleDescription('Cambiar de jugador');
    expect(within(button).getByRole('img', { name: 'Zorro' })).toBeVisible();

    await userEvent.click(button);

    expect(onSwitchPlayer).toHaveBeenCalledOnce();
  });

  it('PRF-03 NFR-06 the player button says "Switch player" in English', async () => {
    renderHome();

    await userEvent.click(screen.getByRole('radio', { name: 'English' }));

    expect(screen.getByRole('button', { name: 'Lucía' })).toHaveAccessibleDescription(
      'Switch player',
    );
  });

  it('PRF-01 shows who plays: the nickname and the avatar, named after its animal', () => {
    renderHome();

    const player = screen.getByRole('group', { name: 'Jugador' });
    expect(player).toHaveTextContent('Lucía');
    expect(within(player).getByRole('img', { name: 'Zorro' })).toBeVisible();
  });

  it('PRF-01 NFR-06 says who plays in English too', async () => {
    renderHome(vi.fn(), { id: 2, nickname: 'Pablo', avatar: 'owl' });

    await userEvent.click(screen.getByRole('radio', { name: 'English' }));

    const player = screen.getByRole('group', { name: 'Player' });
    expect(player).toHaveTextContent('Pablo');
    expect(within(player).getByRole('img', { name: 'Owl' })).toBeVisible();
  });

  it('PRF-02 a player saved with an avatar that is no longer offered shows the first one', () => {
    renderHome(vi.fn(), { id: 3, nickname: 'Ana', avatar: 'turtle' });

    expect(
      within(screen.getByRole('group', { name: 'Jugador' })).getByRole('img', { name: 'Zorro' }),
    ).toBeVisible();
  });

  it('GAME-01 shows the topics Banderas, Capitales and Siluetas, each with its two games', () => {
    renderHome();

    expect(screen.getByRole('heading', { level: 1, name: '¿A qué jugamos?' })).toBeVisible();
    const topics = screen.getAllByRole('region');
    expect(
      topics.map((topic) => within(topic).getByRole('heading', { level: 2 }).textContent),
    ).toEqual(['Banderas', 'Capitales', 'Siluetas']);
    const games: Record<string, [RegExp, RegExp]> = {
      Banderas: [/^Bandera → País/, /^País → Bandera/],
      Capitales: [/^País → Capital/, /^Capital → País/],
      Siluetas: [/^Silueta → País/, /^País → Silueta/],
    };
    for (const [topic, [first, second]] of Object.entries(games)) {
      const region = within(screen.getByRole('region', { name: topic }));
      expect(region.getAllByRole('button')).toEqual([
        region.getByRole('button', { name: first }),
        region.getByRole('button', { name: second }),
      ]);
    }
  });

  it('GAME-01 names each game by its direction and its question', () => {
    renderHome();

    expect(screen.getByRole('button', { name: 'Bandera → País ¿De qué país es?' })).toBeEnabled();
    expect(
      screen.getByRole('button', { name: 'País → Bandera ¿Cuál es su bandera?' }),
    ).toBeEnabled();
  });

  it('GAME-01 both Flags games can be opened', async () => {
    const onOpenGame = vi.fn<(game: PlayableGame) => void>();
    renderHome(onOpenGame);

    await userEvent.click(game('Bandera → País'));
    await userEvent.click(game('País → Bandera'));

    expect(onOpenGame.mock.calls.map(([opened]) => opened.id)).toEqual(['FLAG-A', 'FLAG-B']);
  });

  it('GAME-01 the Capitals and Shapes games show "Pronto" and cannot be opened', async () => {
    const onOpenGame = vi.fn();
    renderHome(onOpenGame);

    for (const name of SOON_GAMES) {
      const soon = game(name);
      expect(soon).toBeDisabled();
      expect(within(soon).getByText('Pronto')).toBeVisible();
      expect(soon).toHaveAccessibleName(/ Pronto$/);
      await userEvent.click(soon);
    }
    expect(onOpenGame).not.toHaveBeenCalled();
  });

  it('GAME-01 the home screen speaks English when English is chosen', async () => {
    renderHome();

    await userEvent.click(screen.getByRole('radio', { name: 'English' }));

    expect(screen.getByRole('heading', { level: 1, name: 'What shall we play?' })).toBeVisible();
    expect(screen.getByRole('region', { name: 'Flags' })).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Flag → Country Which country is it?' }),
    ).toBeEnabled();
    expect(game('Country → Capital')).toHaveAccessibleName(/ Soon$/);
  });
});
