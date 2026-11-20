import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { countries } from '../../data/countries.ts';
import { relations } from '../../data/relations.ts';
import type { Entity } from '../../domain/entity.ts';
import { generateRound, type Question, type RoundSettings } from '../../domain/questions.ts';
import { createRng } from '../../domain/random.ts';
import { ofName } from '../../i18n/names.ts';
import { playableGame } from '../../test/games.ts';
import { renderWithI18n } from '../../test/render.tsx';
import { shapeFile } from '../../test/shapes.ts';
import { RoundScreen } from './RoundScreen.tsx';

// Background: I am playing "País → Silueta" in "Europa · Medio" with seed 42.
const SETTINGS: RoundSettings = { topic: 'shapes', region: 'europe', level: 2 };
const QUESTIONS = generateRound(countries, SETTINGS, createRng(42), relations);
const FIRST = firstQuestion();

function firstQuestion(): Question {
  const [first] = QUESTIONS;
  if (!first) throw new Error('The round has no questions');
  return first;
}

/** "Opción N" of an option: its position in the question, from 1. */
function optionName(question: Question, option: Entity, prefix = 'Opción'): string {
  return `${prefix} ${String(question.options.indexOf(option) + 1)}`;
}

function wrongOption(question: Question): Entity {
  const wrong = question.options.find((option) => option.code !== question.entity.code);
  if (!wrong) throw new Error('A question always has wrong options');
  return wrong;
}

function renderRound() {
  renderWithI18n(
    <RoundScreen
      game={playableGame('SHAPE-B')}
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

function cardItem(name: string): HTMLElement {
  const item = within(answers()).getByRole('button', { name }).closest('li');
  if (!item) throw new Error(`${name} is not in the list of answers`);
  return item;
}

/** Every accessible name and alt text inside the answers: what a screen reader could read out. */
function namesAndAltTexts(): string[] {
  const list = answers();
  const named = [...list.querySelectorAll('[aria-label]')].map(
    (element) => element.getAttribute('aria-label') ?? '',
  );
  const alts = [...list.querySelectorAll('img')].map((image) => image.alt);
  return [...named, ...alts];
}

describe('RoundScreen · SHAPE-B', () => {
  it('SHAPE-B asks "¿Cuál es la forma" followed by the country name', () => {
    renderRound();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      `¿Cuál es la forma ${ofName(FIRST.entity, 'es')}?`,
    );
  });

  it('SHAPE-B GAME-03 shows 4 silhouettes as large cards in a grid, each the silhouette of one option', () => {
    renderRound();

    const cards = within(answers()).getAllByRole('button');
    expect(cards).toHaveLength(4);
    cards.forEach((card, index) => {
      expect(card).toHaveAccessibleName(`Opción ${String(index + 1)}`);
      expect(card.querySelector('img')).toHaveAttribute(
        'src',
        expect.stringMatching(shapeFile(FIRST.options[index]?.code ?? '')),
      );
    });
  });

  it('RND-04 tapping the correct silhouette shows "¡Correcto!" with a ✓ icon', async () => {
    renderRound();
    const correct = optionName(FIRST, FIRST.entity);

    await userEvent.click(screen.getByRole('button', { name: correct }));

    expect(screen.getByRole('status')).toHaveTextContent('¡Correcto!');
    expect(within(screen.getByRole('status')).getByRole('img', { name: 'Correcta' })).toBeVisible();
    expect(within(cardItem(correct)).getByRole('img', { name: 'Correcta' })).toBeVisible();
    expect(screen.queryByRole('img', { name: 'Incorrecta' })).not.toBeInTheDocument();
    expect(screen.getByText('Aciertos: 1')).toBeVisible();
  });

  it('RND-04 tapping a wrong silhouette marks it with ✗ and highlights the correct one with ✓', async () => {
    renderRound();
    const wrong = optionName(FIRST, wrongOption(FIRST));
    const correct = optionName(FIRST, FIRST.entity);

    await userEvent.click(screen.getByRole('button', { name: wrong }));

    expect(within(cardItem(wrong)).getByRole('img', { name: 'Incorrecta' })).toBeVisible();
    expect(within(cardItem(correct)).getByRole('img', { name: 'Correcta' })).toBeVisible();
    // Exactly those two marks: the other two cards stay unmarked.
    expect(
      within(answers())
        .getAllByRole('img')
        .map((mark) => mark.getAttribute('aria-label')),
    ).toEqual(
      FIRST.options.flatMap((option) =>
        option === FIRST.entity
          ? ['Correcta']
          : option === wrongOption(FIRST)
            ? ['Incorrecta']
            : [],
      ),
    );
    expect(
      within(screen.getByRole('status')).getByRole('img', { name: 'Incorrecta' }),
    ).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent(
      `¡Uy! La forma ${ofName(FIRST.entity, 'es')} es la marcada con ✓`,
    );
    for (const card of within(answers()).getAllByRole('button')) {
      expect(card).toBeDisabled();
    }
    expect(screen.getByText('Aciertos: 0')).toBeVisible();
  });

  it('SHAPE-B SHAPE-01 the cards are named "Opción N" and no name or alt text tells a country, before or after answering', async () => {
    renderRound();
    const countryNames = countries.flatMap((country) => [country.name.es, country.name.en]);
    const tellsACountry = (text: string) => countryNames.some((name) => text.includes(name));

    expect(
      within(answers())
        .getAllByRole('button')
        .map((card) => card.getAttribute('aria-label')),
    ).toEqual(['Opción 1', 'Opción 2', 'Opción 3', 'Opción 4']);
    expect([...answers().querySelectorAll('img')].map((image) => image.alt)).toEqual([
      '',
      '',
      '',
      '',
    ]);
    expect(namesAndAltTexts().filter(tellsACountry)).toEqual([]);

    await userEvent.click(
      screen.getByRole('button', { name: optionName(FIRST, wrongOption(FIRST)) }),
    );

    expect(namesAndAltTexts().filter(tellsACountry)).toEqual([]);
  });

  it('SHAPE-B NFR-06 the round speaks English when English is chosen', async () => {
    localStorage.setItem('miatlas67.language', 'en');
    renderRound();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      `Which one is the shape ${ofName(FIRST.entity, 'en')}?`,
    );
    const wrong = optionName(FIRST, wrongOption(FIRST), 'Option');
    await userEvent.click(screen.getByRole('button', { name: wrong }));

    expect(screen.getByRole('status')).toHaveTextContent(
      `Oops! The shape ${ofName(FIRST.entity, 'en')} is the one marked ✓`,
    );
    expect(within(cardItem(wrong)).getByRole('img', { name: 'Wrong' })).toBeVisible();
  });
});
