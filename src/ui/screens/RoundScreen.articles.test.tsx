import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { countries } from '../../data/countries.ts';
import type { Entity } from '../../domain/entity.ts';
import type { GameId } from '../../domain/games.ts';
import type { Question, RoundSettings } from '../../domain/questions.ts';
import { answer, next, roundResult, startRound } from '../../domain/round.ts';
import { playableGame } from '../../test/games.ts';
import { renderWithI18n } from '../../test/render.tsx';
import { RoundScreen } from './RoundScreen.tsx';
import { SummaryScreen } from './SummaryScreen.tsx';

// Names in sentences keep the article they take (DATA-09, D18); options and lists show the name alone.
const SETTINGS: RoundSettings = { topic: 'flags', region: 'world', level: 1 };

function byCode(code: string): Entity {
  const entity = countries.find((c) => c.code === code);
  if (!entity) throw new Error(`No entity with code ${code}`);
  return entity;
}

const FRANCE = byCode('FR');

/** A question about `code`, with Francia (or Alemania, when Francia is asked) as the wrong options. */
function questionAbout(code: string): Question {
  const others = ['FR', 'DE', 'IT', 'PT'].filter((other) => other !== code).slice(0, 3);
  return { entity: byCode(code), options: [byCode(code), ...others.map(byCode)] };
}

function renderRound(game: GameId, code: string) {
  renderWithI18n(
    <RoundScreen
      game={playableGame(game)}
      settings={SETTINGS}
      questions={[questionAbout(code)]}
      onQuit={vi.fn()}
      onFinish={vi.fn()}
    />,
  );
}

const heading = () => screen.getByRole('heading', { level: 1 });
const feedback = () => screen.getByRole('status');

/** In FLAG-B the cards are "Opción N" / "Option N", by their position: the card of Francia. */
function franceCard(code: string, prefix: 'Opción' | 'Option'): string {
  return `${prefix} ${String(questionAbout(code).options.indexOf(FRANCE) + 1)}`;
}

describe('RoundScreen · names with their article (DATA-09)', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it.each([
    ['GB', '¿Cuál es la bandera del Reino Unido?'],
    ['DO', '¿Cuál es la bandera de la República Dominicana?'],
    ['NL', '¿Cuál es la bandera de los Países Bajos?'],
    ['BS', '¿Cuál es la bandera de Bahamas?'],
    ['US', '¿Cuál es la bandera de Estados Unidos?'],
    ['FR', '¿Cuál es la bandera de Francia?'],
    ['SV', '¿Cuál es la bandera de El Salvador?'],
  ])('DATA-09 FLAG-B asks about %s: "%s"', (code, question) => {
    renderRound('FLAG-B', code);

    expect(heading()).toHaveTextContent(question);
    // The large line is the name alone, as in the «Bloques» mockup.
    expect(within(heading()).getByText(`${byCode(code).name.es}?`)).toBeVisible();
  });

  it.each([
    ['GB', 'Which one is the flag of the United Kingdom?'],
    ['NL', 'Which one is the flag of the Netherlands?'],
    ['FR', 'Which one is the flag of France?'],
  ])('DATA-09 SET-01 FLAG-B asks about %s in English: "%s"', (code, question) => {
    localStorage.setItem('miatlas67.language', 'en');
    renderRound('FLAG-B', code);

    expect(heading()).toHaveTextContent(question);
    expect(within(heading()).getByText(`${byCode(code).name.en}?`)).toBeVisible();
  });

  it('DATA-09 RND-04 FLAG-A a wrong answer names "el Reino Unido"; the options show the name alone', async () => {
    renderRound('FLAG-A', 'GB');
    expect(screen.getByRole('button', { name: 'Reino Unido' })).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: FRANCE.name.es }));

    expect(feedback()).toHaveTextContent('¡Uy! Era el Reino Unido');
    expect(screen.getByRole('button', { name: 'Reino Unido' })).toBeDisabled();
  });

  it('DATA-09 RND-04 FLAG-A a wrong answer names "la República Dominicana"', async () => {
    renderRound('FLAG-A', 'DO');

    await userEvent.click(screen.getByRole('button', { name: FRANCE.name.es }));

    expect(feedback()).toHaveTextContent('¡Uy! Era la República Dominicana');
  });

  it('DATA-09 RND-04 FLAG-A a wrong answer agrees with the plural: "Eran los Países Bajos"; the options show the name alone', async () => {
    renderRound('FLAG-A', 'NL');
    expect(screen.getByRole('button', { name: 'Países Bajos' })).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: FRANCE.name.es }));

    expect(feedback()).toHaveTextContent('¡Uy! Eran los Países Bajos');
    expect(screen.getByRole('button', { name: 'Países Bajos' })).toBeDisabled();
  });

  it('DATA-09 RND-04 FLAG-B a wrong answer points at the flag "de los Países Bajos"', async () => {
    renderRound('FLAG-B', 'NL');

    await userEvent.click(screen.getByRole('button', { name: franceCard('NL', 'Opción') }));

    expect(feedback()).toHaveTextContent('¡Uy! La bandera de los Países Bajos es la marcada con ✓');
  });

  it.each([
    ['BS', '¡Uy! Era Bahamas'],
    ['US', '¡Uy! Era Estados Unidos'],
  ])(
    'DATA-09 RND-04 FLAG-A a wrong answer about another plural name keeps "Era": %s is "%s"',
    async (code, sentence) => {
      renderRound('FLAG-A', code);

      await userEvent.click(screen.getByRole('button', { name: FRANCE.name.es }));

      expect(feedback()).toHaveTextContent(sentence);
    },
  );

  it('DATA-09 RND-04 SET-01 FLAG-A in English a wrong answer about the Netherlands is "It was the Netherlands"', async () => {
    localStorage.setItem('miatlas67.language', 'en');
    renderRound('FLAG-A', 'NL');
    await userEvent.click(screen.getByRole('button', { name: FRANCE.name.en }));
    expect(feedback()).toHaveTextContent('Oops! It was the Netherlands');
  });

  it('DATA-09 RND-04 FLAG-B a wrong answer points at the flag "del Reino Unido"', async () => {
    renderRound('FLAG-B', 'GB');

    await userEvent.click(screen.getByRole('button', { name: franceCard('GB', 'Opción') }));

    expect(feedback()).toHaveTextContent('¡Uy! La bandera del Reino Unido es la marcada con ✓');
  });

  it('DATA-09 RND-04 SET-01 FLAG-A in English a wrong answer names "the United Kingdom"; the options show the name alone', async () => {
    localStorage.setItem('miatlas67.language', 'en');
    renderRound('FLAG-A', 'GB');
    expect(screen.getByRole('button', { name: 'United Kingdom' })).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: FRANCE.name.en }));
    expect(feedback()).toHaveTextContent('Oops! It was the United Kingdom');
  });

  it('DATA-09 RND-04 SET-01 FLAG-B in English points at the flag "of the United Kingdom"', async () => {
    localStorage.setItem('miatlas67.language', 'en');
    renderRound('FLAG-B', 'GB');
    await userEvent.click(screen.getByRole('button', { name: franceCard('GB', 'Option') }));
    expect(feedback()).toHaveTextContent(
      'Oops! The flag of the United Kingdom is the one marked ✓',
    );
  });

  it.each([
    ['es', 'Para repasar', 'GB', 'Reino Unido'],
    ['en', 'To review', 'GB', 'United Kingdom'],
    ['es', 'Para repasar', 'NL', 'Países Bajos'],
    ['en', 'To review', 'NL', 'Netherlands'],
  ])(
    'DATA-09 RND-08 SET-01 in "%s", "%s" lists %s by the name alone: "%s"',
    (language, list, code, name) => {
      localStorage.setItem('miatlas67.language', language);
      let state = startRound([questionAbout(code)]);
      state = next(answer(state, 'FR'));
      renderWithI18n(
        <SummaryScreen
          game={playableGame('FLAG-A')}
          settings={SETTINGS}
          result={roundResult(state)}
          onPlayAgain={vi.fn()}
          onMenu={vi.fn()}
        />,
      );

      const missed = within(screen.getByRole('list', { name: list })).getAllByRole('listitem');
      expect(missed.map((item) => item.textContent)).toEqual([name]);
    },
  );
});
