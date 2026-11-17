import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { countries } from '../../data/countries.ts';
import { relations } from '../../data/relations.ts';
import { generateRound, type Question, type RoundSettings } from '../../domain/questions.ts';
import { createRng } from '../../domain/random.ts';
import { answer, next, roundResult, startRound, type RoundResult } from '../../domain/round.ts';
import { flagFile } from '../../test/flags.ts';
import { playableGame } from '../../test/games.ts';
import { renderWithI18n } from '../../test/render.tsx';
import { SummaryScreen } from './SummaryScreen.tsx';

const SETTINGS: RoundSettings = { topic: 'flags', region: 'europe', level: 1 };
const QUESTIONS = generateRound(countries, SETTINGS, createRng(42), relations);

function wrongCode(question: Question): string {
  const wrong = question.options.find((option) => option.code !== question.entity.code);
  if (!wrong) throw new Error('A question always has wrong options');
  return wrong.code;
}

/** The result of the seed-42 round, played with the questions at `wrongAt` answered wrongly. */
function resultWith(wrongAt: readonly number[]): RoundResult {
  let state = startRound(QUESTIONS);
  QUESTIONS.forEach((question, index) => {
    state = answer(state, wrongAt.includes(index) ? wrongCode(question) : question.entity.code);
    state = next(state);
  });
  return roundResult(state);
}

function renderSummary(result: RoundResult) {
  const onPlayAgain = vi.fn();
  const onMenu = vi.fn();
  renderWithI18n(
    <SummaryScreen
      game={playableGame('FLAG-A')}
      settings={SETTINGS}
      result={result}
      onPlayAgain={onPlayAgain}
      onMenu={onMenu}
    />,
  );
  return { onPlayAgain, onMenu };
}

function question(index: number): Question {
  const found = QUESTIONS[index];
  if (!found) throw new Error(`No question ${String(index)}`);
  return found;
}

describe('SummaryScreen', () => {
  it('SCR-01 SCR-02 a round with 8 correct answers shows "8/10" and 2 stars', () => {
    renderSummary(resultWith([3, 7]));

    expect(screen.getByText('8/10')).toBeVisible();
    expect(screen.getByRole('img', { name: '2 de 3 estrellas' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('¡Muy bien!');
    expect(
      within(screen.getByRole('list', { name: 'Esta partida' })).getAllByRole('listitem'),
    ).toHaveLength(3);
  });

  it('RND-08 lists the 2 missed entities with their correct answers', () => {
    renderSummary(resultWith([3, 7]));

    const missed = within(screen.getByRole('list', { name: 'Para repasar' })).getAllByRole(
      'listitem',
    );
    expect(missed.map((item) => item.textContent)).toEqual([
      question(3).entity.name.es,
      question(7).entity.name.es,
    ]);
    missed.forEach((item, index) => {
      const code = question([3, 7][index] ?? 0).entity.code;
      expect(item.querySelector('img')).toHaveAttribute(
        'src',
        expect.stringMatching(flagFile(code)),
      );
    });
  });

  it('RND-08 SCR-02 a perfect round shows 3 stars and a celebration, and no list of missed entities', () => {
    renderSummary(resultWith([]));

    expect(screen.getByText('10/10')).toBeVisible();
    expect(screen.getByRole('img', { name: '3 de 3 estrellas' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('¡Perfecto!');
    expect(screen.getByRole('img', { name: '¡Ronda perfecta!' })).toBeVisible();
    expect(screen.queryByRole('list', { name: 'Para repasar' })).not.toBeInTheDocument();
  });

  it('SCR-02 a round below 5 correct answers has no stars and still encourages', () => {
    renderSummary(resultWith([0, 1, 2, 3, 4, 5]));

    expect(screen.getByText('4/10')).toBeVisible();
    expect(screen.getByRole('img', { name: '0 de 3 estrellas' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('¡A seguir practicando!');
    expect(screen.queryByRole('img', { name: '¡Ronda perfecta!' })).not.toBeInTheDocument();
    expect(
      within(screen.getByRole('list', { name: 'Para repasar' })).getAllByRole('listitem'),
    ).toHaveLength(6);
  });

  it('RND-08 "Jugar otra vez" and "Menú" are the two ways on', async () => {
    const { onPlayAgain, onMenu } = renderSummary(resultWith([3, 7]));

    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: 'Jugar otra vez' }));
    expect(onPlayAgain).toHaveBeenCalledOnce();
    expect(onMenu).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Menú' }));
    expect(onMenu).toHaveBeenCalledOnce();
  });

  it('RND-08 NFR-06 the summary speaks English when English is chosen', () => {
    localStorage.setItem('miatlas67.language', 'en');
    renderSummary(resultWith([3, 7]));

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Great job!');
    expect(screen.getByRole('img', { name: '2 of 3 stars' })).toBeVisible();
    expect(
      within(screen.getByRole('list', { name: 'To review' }))
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([question(3).entity.name.en, question(7).entity.name.en]);
    expect(screen.getByRole('button', { name: 'Play again' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Menu' })).toBeVisible();
  });
});
