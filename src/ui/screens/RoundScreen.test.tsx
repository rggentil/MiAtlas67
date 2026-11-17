import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { countries } from '../../data/countries.ts';
import { relations } from '../../data/relations.ts';
import type { Entity } from '../../domain/entity.ts';
import { GAMES } from '../../domain/games.ts';
import { generateRound, type Question, type RoundSettings } from '../../domain/questions.ts';
import { createRng } from '../../domain/random.ts';
import type { RoundResult } from '../../domain/round.ts';
import { flagFile } from '../../test/flags.ts';
import { renderWithI18n } from '../../test/render.tsx';
import { isPlayable, type PlayableGame } from '../games.ts';
import { RoundScreen } from './RoundScreen.tsx';

const SETTINGS: RoundSettings = { topic: 'flags', region: 'europe', level: 1 };
const QUESTIONS = generateRound(countries, SETTINGS, createRng(42), relations);

function playable(id: string): PlayableGame {
  const game = GAMES.find((candidate) => candidate.id === id);
  if (!game || !isPlayable(game)) throw new Error(`${id} is not playable`);
  return game;
}

function questionAt(index: number): Question {
  const question = QUESTIONS[index];
  if (!question) throw new Error(`No question ${String(index)}`);
  return question;
}

function wrongOption(question: Question): Entity {
  const wrong = question.options.find((option) => option.code !== question.entity.code);
  if (!wrong) throw new Error('A question always has wrong options');
  return wrong;
}

function renderRound() {
  const onQuit = vi.fn();
  const onFinish = vi.fn<(result: RoundResult) => void>();
  renderWithI18n(
    <RoundScreen
      game={playable('FLAG-A')}
      settings={SETTINGS}
      questions={QUESTIONS}
      onQuit={onQuit}
      onFinish={onFinish}
    />,
  );
  return { onQuit, onFinish };
}

/** The list item of an option, which holds its button and, after answering, its ✓ or ✗ mark. */
function optionItem(name: string): HTMLElement {
  const button = screen.getByRole('button', { name });
  const item = button.closest('li');
  if (!item) throw new Error(`${name} is not in the list of answers`);
  return item;
}

function feedback(): HTMLElement {
  return screen.getByRole('status');
}

const FIRST = questionAt(0);

describe('RoundScreen · FLAG-A', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('FLAG-A GAME-03 shows a flag and 3 country names as large buttons in a vertical list', () => {
    renderRound();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      '¿De qué país es esta bandera?',
    );
    const flag = screen.getByRole('img', { name: 'La bandera que hay que adivinar' });
    expect(flag).toHaveAttribute('src', expect.stringMatching(flagFile(FIRST.entity.code)));
    const answers = within(screen.getByRole('list', { name: 'Respuestas' }));
    expect(answers.getAllByRole('button').map((button) => button.textContent)).toEqual(
      FIRST.options.map((option) => option.name.es),
    );
    expect(answers.getAllByRole('button')).toHaveLength(3);
  });

  it('FLAG-A the flag never tells the answer: its alternative text names no country', () => {
    renderRound();

    const alt = screen.getByRole('img', { name: /bandera/ }).getAttribute('alt') ?? '';
    for (const country of countries) {
      expect(alt).not.toContain(country.name.es);
      expect(alt).not.toContain(country.name.en);
    }
  });

  it('RND-06 shows the progress 1/10 and the score from the start', () => {
    renderRound();

    expect(screen.getByText('1/10')).toBeVisible();
    expect(screen.getByRole('progressbar', { name: 'Progreso de la partida' })).toHaveAttribute(
      'aria-valuenow',
      '1',
    );
    expect(screen.getByText('Aciertos: 0')).toBeVisible();
  });

  it('RND-04 a correct answer shows "¡Correcto!" with a ✓ icon and adds 1 to the score', async () => {
    renderRound();

    await userEvent.click(screen.getByRole('button', { name: FIRST.entity.name.es }));

    expect(feedback()).toHaveTextContent('¡Correcto!');
    expect(within(feedback()).getByRole('img', { name: 'Correcta' })).toBeVisible();
    expect(
      within(optionItem(FIRST.entity.name.es)).getByRole('img', { name: 'Correcta' }),
    ).toBeVisible();
    expect(screen.queryByRole('img', { name: 'Incorrecta' })).not.toBeInTheDocument();
    expect(screen.getByText('Aciertos: 1')).toBeVisible();
  });

  it('RND-04 a wrong answer marks my option with ✗, the correct one with ✓, and names it', async () => {
    renderRound();
    const wrong = wrongOption(FIRST);

    await userEvent.click(screen.getByRole('button', { name: wrong.name.es }));

    expect(
      within(optionItem(wrong.name.es)).getByRole('img', { name: 'Incorrecta' }),
    ).toBeVisible();
    expect(
      within(optionItem(FIRST.entity.name.es)).getByRole('img', { name: 'Correcta' }),
    ).toBeVisible();
    expect(feedback()).toHaveTextContent(`¡Casi! Era ${FIRST.entity.name.es}`);
    expect(within(feedback()).getByRole('img', { name: 'Incorrecta' })).toBeVisible();
    expect(screen.getByText('Aciertos: 0')).toBeVisible();
  });

  it('RND-04 an answered question cannot be answered again', async () => {
    renderRound();
    const wrong = wrongOption(FIRST);

    await userEvent.click(screen.getByRole('button', { name: wrong.name.es }));
    await userEvent.click(screen.getByRole('button', { name: FIRST.entity.name.es }));

    for (const option of FIRST.options) {
      expect(screen.getByRole('button', { name: option.name.es })).toBeDisabled();
    }
    expect(feedback()).toHaveTextContent(`¡Casi! Era ${FIRST.entity.name.es}`);
    expect(screen.getByText('Aciertos: 0')).toBeVisible();
  });

  it('RND-05 the game waits for "Siguiente", then shows the next question', async () => {
    renderRound();
    expect(screen.queryByRole('button', { name: 'Siguiente' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: FIRST.entity.name.es }));
    const next = screen.getByRole('button', { name: 'Siguiente' });
    expect(next).toHaveFocus();
    expect(screen.getByText('1/10')).toBeVisible();

    await userEvent.click(next);

    const second = questionAt(1);
    expect(screen.getByText('2/10')).toBeVisible();
    expect(screen.getByRole('img', { name: 'La bandera que hay que adivinar' })).toHaveAttribute(
      'src',
      expect.stringMatching(flagFile(second.entity.code)),
    );
    expect(screen.getByRole('button', { name: second.options[0]?.name.es })).toBeEnabled();
    expect(feedback()).toHaveTextContent('');
    expect(screen.getByText('Aciertos: 1')).toBeVisible();
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
  });

  it('RND-03 there is no timer: nothing changes by itself, before or after answering', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });
    renderRound();

    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(10 * 60_000);
    });
    expect(screen.getByText('1/10')).toBeVisible();
    expect(screen.getByRole('button', { name: FIRST.entity.name.es })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: FIRST.entity.name.es }));
    act(() => {
      vi.advanceTimersByTime(10 * 60_000);
    });
    expect(screen.getByText('1/10')).toBeVisible();
    expect(feedback()).toHaveTextContent('¡Correcto!');
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
  });

  it('RND-07 "Salir de la partida" asks first, and "Seguir jugando" keeps the round', async () => {
    const { onQuit } = renderRound();

    await userEvent.click(screen.getByRole('button', { name: 'Salir de la partida' }));
    const dialog = screen.getByRole('dialog', { name: '¿Salir de la partida?' });
    expect(dialog).toHaveAccessibleDescription('Si sales ahora, esta partida no se guarda.');
    expect(within(dialog).getByRole('button', { name: 'Seguir jugando' })).toHaveFocus();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Seguir jugando' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salir de la partida' })).toHaveFocus();
    expect(screen.getByText('1/10')).toBeVisible();
    expect(onQuit).not.toHaveBeenCalled();
  });

  it('RND-07 Escape closes the quit dialog without quitting', async () => {
    const { onQuit } = renderRound();

    await userEvent.click(screen.getByRole('button', { name: 'Salir de la partida' }));
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onQuit).not.toHaveBeenCalled();
  });

  it('RND-07 confirming quits the round without a result, so it is not saved', async () => {
    const { onQuit, onFinish } = renderRound();
    await userEvent.click(screen.getByRole('button', { name: FIRST.entity.name.es }));

    await userEvent.click(screen.getByRole('button', { name: 'Salir de la partida' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sí, salir' }));

    expect(onQuit).toHaveBeenCalledOnce();
    expect(onFinish).not.toHaveBeenCalled();
  });

  it('RND-05 "Siguiente" after the 10th answer finishes the round with its result', async () => {
    const { onFinish } = renderRound();

    for (const [index, question] of QUESTIONS.entries()) {
      const name = index < 8 ? question.entity.name.es : wrongOption(question).name.es;
      await userEvent.click(screen.getByRole('button', { name }));
      expect(onFinish).not.toHaveBeenCalled();
      await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    }

    expect(onFinish).toHaveBeenCalledExactlyOnceWith({
      score: 8,
      total: 10,
      stars: 2,
      missed: [questionAt(8).entity, questionAt(9).entity],
    });
  });

  it('FLAG-A the round speaks English when English is chosen', async () => {
    localStorage.setItem('miatlas67.language', 'en');
    renderRound();
    const wrong = wrongOption(FIRST);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Which country does this flag belong to?',
    );
    expect(screen.getByText('Correct: 0')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: wrong.name.en }));

    expect(feedback()).toHaveTextContent(`So close! It was ${FIRST.entity.name.en}`);
    expect(within(optionItem(wrong.name.en)).getByRole('img', { name: 'Wrong' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Next' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Quit the round' })).toBeVisible();
  });
});
