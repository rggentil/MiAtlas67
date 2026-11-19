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

/** Which of the three stars are drawn filled, left to right. */
function filledStars(): boolean[] {
  const stars = screen.getByRole('img', { name: /de 3 estrellas$/ });
  return [...stars.querySelectorAll('svg')].map((star) => star.dataset.filled === 'true');
}

function renderSummary(result: RoundResult, newRecord = false) {
  const onPlayAgain = vi.fn();
  const onMenu = vi.fn();
  renderWithI18n(
    <SummaryScreen
      game={playableGame('FLAG-A')}
      settings={SETTINGS}
      result={result}
      newRecord={newRecord}
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
  it('RND-08 a new personal best shows "¡Nuevo récord!" in a status message', () => {
    renderSummary(resultWith([0, 1]), true);

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('¡Nuevo récord!');
    expect(within(status).getByText('¡Nuevo récord!')).toBeVisible();
  });

  it('RND-08 without a new personal best there is no "¡Nuevo récord!", and the status message is empty', () => {
    renderSummary(resultWith([0, 1]), false);

    expect(screen.queryByText('¡Nuevo récord!')).not.toBeInTheDocument();
    expect(screen.getByRole('status', { hidden: true })).toBeEmptyDOMElement();
  });

  it('RND-08 NFR-06 "New record!" in English', () => {
    localStorage.setItem('miatlas67.language', 'en');
    renderSummary(resultWith([]), true);

    expect(screen.getByRole('status')).toHaveTextContent('New record!');
  });

  it('SCR-01 SCR-02 a round with 8 correct answers shows "8/10" and 2 stars', () => {
    renderSummary(resultWith([3, 7]));

    expect(screen.getByText('8/10')).toBeVisible();
    expect(screen.getByRole('img', { name: '2 de 3 estrellas' })).toBeVisible();
    expect(filledStars()).toEqual([true, true, false]);
    expect(
      within(screen.getByRole('list', { name: 'Esta partida' }))
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Banderas', 'Europa', 'Fácil']);
  });

  it.each([
    { wrong: [0, 1, 2, 3, 4, 5], score: '4/10', stars: 0, title: '¡A seguir practicando!' },
    { wrong: [0, 1, 2, 3, 4], score: '5/10', stars: 1, title: '¡Bien hecho!' },
    { wrong: [3, 7], score: '8/10', stars: 2, title: '¡Muy bien!' },
    { wrong: [], score: '10/10', stars: 3, title: '¡Perfecto!' },
  ])(
    'SCR-02 $score gives $stars stars and an encouraging title: $title',
    ({ wrong, score, stars, title }) => {
      renderSummary(resultWith(wrong));

      expect(screen.getByText(score)).toBeVisible();
      expect(screen.getByRole('img', { name: `${String(stars)} de 3 estrellas` })).toBeVisible();
      expect(filledStars().filter(Boolean)).toHaveLength(stars);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(title);
    },
  );

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
    const celebration = screen.getByRole('img', { name: '¡Ronda perfecta!' });
    expect(celebration).toBeVisible();
    expect(celebration.children.length).toBeGreaterThan(0);
    expect(screen.queryByRole('list', { name: 'Para repasar' })).not.toBeInTheDocument();
  });

  it('SCR-02 a round below 5 correct answers lists every missed country and has no celebration', () => {
    renderSummary(resultWith([0, 1, 2, 3, 4, 5]));

    expect(screen.queryByRole('img', { name: '¡Ronda perfecta!' })).not.toBeInTheDocument();
    expect(
      within(screen.getByRole('list', { name: 'Para repasar' })).getAllByRole('listitem'),
    ).toHaveLength(6);
  });

  it('NFR-05 the summary title takes the focus when the summary opens', () => {
    renderSummary(resultWith([3, 7]));

    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
  });

  it('RND-08 "Jugar otra vez" and "Menú" are the two ways on', async () => {
    const { onPlayAgain, onMenu } = renderSummary(resultWith([3, 7]));

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

  it('RND-08 CAP-A each missed country is listed with its capital', () => {
    const settings: RoundSettings = { topic: 'capitals', region: 'europe', level: 1 };
    const questions = generateRound(countries, settings, createRng(42), relations);
    let state = startRound(questions);
    questions.forEach((asked, index) => {
      state = answer(state, index === 2 ? wrongCode(asked) : asked.entity.code);
      state = next(state);
    });
    const [missedEntity] = roundResult(state).missed;
    if (!missedEntity?.capital) throw new Error('The missed country has a capital');
    renderWithI18n(
      <SummaryScreen
        game={playableGame('CAP-A')}
        settings={settings}
        result={roundResult(state)}
        newRecord={false}
        onPlayAgain={vi.fn()}
        onMenu={vi.fn()}
      />,
    );

    const [item] = within(screen.getByRole('list', { name: 'Para repasar' })).getAllByRole(
      'listitem',
    );
    if (!item) throw new Error('The missed country is listed');
    expect(item).toHaveTextContent(`${missedEntity.name.es}${missedEntity.capital.es}`);
    expect(within(item).getByText(missedEntity.capital.es)).toBeVisible();
  });

  it('RND-08 CAP-A NFR-06 in English the missed country is listed with its English capital', () => {
    localStorage.setItem('miatlas67.language', 'en');
    const settings: RoundSettings = { topic: 'capitals', region: 'europe', level: 1 };
    const questions = generateRound(countries, settings, createRng(42), relations);
    const missedAt = questions.findIndex(
      (asked) => asked.entity.capital && asked.entity.capital.es !== asked.entity.capital.en,
    );
    expect(missedAt).toBeGreaterThanOrEqual(0);
    let state = startRound(questions);
    questions.forEach((asked, index) => {
      state = answer(state, index === missedAt ? wrongCode(asked) : asked.entity.code);
      state = next(state);
    });
    const [missedEntity] = roundResult(state).missed;
    if (!missedEntity?.capital) throw new Error('The missed country has a capital');
    renderWithI18n(
      <SummaryScreen
        game={playableGame('CAP-A')}
        settings={settings}
        result={roundResult(state)}
        newRecord={false}
        onPlayAgain={vi.fn()}
        onMenu={vi.fn()}
      />,
    );

    expect(
      within(screen.getByRole('list', { name: 'To review' })).getByRole('listitem'),
    ).toHaveTextContent(`${missedEntity.name.en}${missedEntity.capital.en}`);
  });
});
