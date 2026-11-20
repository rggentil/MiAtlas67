import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { countries } from '../../data/countries.ts';
import { relations } from '../../data/relations.ts';
import type { Entity } from '../../domain/entity.ts';
import { generateRound, type Question, type RoundSettings } from '../../domain/questions.ts';
import { createRng } from '../../domain/random.ts';
import { nameInSentence, wasWords } from '../../i18n/names.ts';
import { playableGame } from '../../test/games.ts';
import { renderWithI18n } from '../../test/render.tsx';
import { shapeFile } from '../../test/shapes.ts';
import { RoundScreen } from './RoundScreen.tsx';

// Background: I am playing "Silueta → País" in "Europa · Medio" with seed 42.
const SETTINGS: RoundSettings = { topic: 'shapes', region: 'europe', level: 2 };
const QUESTIONS = generateRound(countries, SETTINGS, createRng(42), relations);
const FIRST = firstQuestion();

function firstQuestion(): Question {
  const [first] = QUESTIONS;
  if (!first) throw new Error('The round has no questions');
  return first;
}

function wrongOption(question: Question): Entity {
  const wrong = question.options.find((option) => option.code !== question.entity.code);
  if (!wrong) throw new Error('A question always has wrong options');
  return wrong;
}

function renderRound() {
  renderWithI18n(
    <RoundScreen
      game={playableGame('SHAPE-A')}
      settings={SETTINGS}
      questions={QUESTIONS}
      onQuit={vi.fn()}
      onFinish={vi.fn()}
    />,
  );
}

function answers(): HTMLElement {
  return screen.getByRole('list', { name: /Respuestas|Answers/ });
}

function optionItem(name: string): HTMLElement {
  const item = within(answers()).getByRole('button', { name }).closest('li');
  if (!item) throw new Error(`${name} is not in the list of answers`);
  return item;
}

describe('RoundScreen · SHAPE-A', () => {
  it('SHAPE-A GAME-03 shows "¿Qué país tiene esta forma?", one silhouette and 4 countries as buttons', () => {
    renderRound();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      '¿Qué país tiene esta forma?',
    );
    const shape = screen.getByRole('img', { name: 'La silueta que hay que adivinar' });
    expect(shape).toHaveAttribute('src', expect.stringMatching(shapeFile(FIRST.entity.code)));
    expect(
      within(answers())
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(FIRST.options.map((option) => option.name.es));
  });

  it('SHAPE-01 the silhouette has no label: its alternative text and the screen around it name no country', () => {
    renderRound();
    const countryNames = countries.flatMap((country) => [country.name.es, country.name.en]);

    const alt = screen.getByRole('img', { name: /silueta/ }).getAttribute('alt') ?? '';
    expect(countryNames.filter((name) => alt.includes(name))).toEqual([]);
    // Before answering, the only country names on screen are the options themselves.
    const outsideAnswers = (document.querySelector('main')?.textContent ?? '').replace(
      answers().textContent,
      '',
    );
    expect(countryNames.filter((name) => outsideAnswers.includes(name))).toEqual([]);
  });

  it('RND-04 tapping the correct country shows "¡Correcto!" with a ✓ icon', async () => {
    renderRound();

    await userEvent.click(screen.getByRole('button', { name: FIRST.entity.name.es }));

    expect(screen.getByRole('status')).toHaveTextContent('¡Correcto!');
    expect(within(screen.getByRole('status')).getByRole('img', { name: 'Correcta' })).toBeVisible();
    expect(
      within(optionItem(FIRST.entity.name.es)).getByRole('img', { name: 'Correcta' }),
    ).toBeVisible();
    expect(screen.getByText('Aciertos: 1')).toBeVisible();
  });

  it('RND-04 tapping a wrong country marks it ✗, highlights the right one ✓ and names it with its article', async () => {
    renderRound();
    const wrong = wrongOption(FIRST).name.es;

    await userEvent.click(screen.getByRole('button', { name: wrong }));

    expect(within(optionItem(wrong)).getByRole('img', { name: 'Incorrecta' })).toBeVisible();
    expect(
      within(optionItem(FIRST.entity.name.es)).getByRole('img', { name: 'Correcta' }),
    ).toBeVisible();
    expect(within(answers()).getAllByRole('img')).toHaveLength(2);
    expect(screen.getByRole('status')).toHaveTextContent(
      `¡Uy! ${wasWords(FIRST.entity, 'es')} ${nameInSentence(FIRST.entity, 'es')}`,
    );
    expect(
      within(screen.getByRole('status')).getByRole('img', { name: 'Incorrecta' }),
    ).toBeVisible();
    expect(screen.getByText('Aciertos: 0')).toBeVisible();
  });

  it('SHAPE-A NFR-06 the round speaks English when English is chosen', async () => {
    localStorage.setItem('miatlas67.language', 'en');
    renderRound();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Which country has this shape?',
    );
    const alt = screen.getByRole('img', { name: 'The shape to guess' }).getAttribute('alt') ?? '';
    expect(countries.filter((country) => alt.includes(country.name.en))).toEqual([]);
    await userEvent.click(screen.getByRole('button', { name: wrongOption(FIRST).name.en }));

    expect(screen.getByRole('status')).toHaveTextContent(
      `Oops! It was ${nameInSentence(FIRST.entity, 'en')}`,
    );
  });
});
