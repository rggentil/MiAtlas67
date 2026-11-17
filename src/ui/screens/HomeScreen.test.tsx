import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { PlayableGame } from '../games.ts';
import { renderWithI18n } from '../../test/render.tsx';
import { HomeScreen } from './HomeScreen.tsx';

const SOON_GAMES = ['País → Capital', 'Capital → País', 'Silueta → País', 'País → Silueta'];

/** A game button, found by the start of its name: "Bandera → País ¿De qué país es?". */
function game(name: string): HTMLElement {
  return screen.getByRole('button', { name: (accessibleName) => accessibleName.startsWith(name) });
}

describe('HomeScreen', () => {
  it('GAME-01 shows the topics Banderas, Capitales and Siluetas, each with its two games', () => {
    renderWithI18n(<HomeScreen onOpenGame={vi.fn()} />);

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
    renderWithI18n(<HomeScreen onOpenGame={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Bandera → País ¿De qué país es?' })).toBeEnabled();
    expect(
      screen.getByRole('button', { name: 'País → Bandera ¿Cuál es su bandera?' }),
    ).toBeEnabled();
  });

  it('GAME-01 both Flags games can be opened', async () => {
    const onOpenGame = vi.fn<(game: PlayableGame) => void>();
    renderWithI18n(<HomeScreen onOpenGame={onOpenGame} />);

    await userEvent.click(game('Bandera → País'));
    await userEvent.click(game('País → Bandera'));

    expect(onOpenGame.mock.calls.map(([opened]) => opened.id)).toEqual(['FLAG-A', 'FLAG-B']);
  });

  it('GAME-01 the Capitals and Shapes games show "Pronto" and cannot be opened', async () => {
    const onOpenGame = vi.fn();
    renderWithI18n(<HomeScreen onOpenGame={onOpenGame} />);

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
    renderWithI18n(<HomeScreen onOpenGame={vi.fn()} />);

    await userEvent.click(screen.getByRole('radio', { name: 'English' }));

    expect(screen.getByRole('heading', { level: 1, name: 'What shall we play?' })).toBeVisible();
    expect(screen.getByRole('region', { name: 'Flags' })).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Flag → Country Which country is it?' }),
    ).toBeEnabled();
    expect(game('Country → Capital')).toHaveAccessibleName(/ Soon$/);
  });
});
