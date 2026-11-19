import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { countries } from '../../data/countries.ts';
import { relations } from '../../data/relations.ts';
import type { Entity } from '../../domain/entity.ts';
import { generateRound, type Question, type RoundSettings } from '../../domain/questions.ts';
import { createRng } from '../../domain/random.ts';
import { ofName } from '../../i18n/names.ts';
import { flagFile } from '../../test/flags.ts';
import { playableGame } from '../../test/games.ts';
import { renderWithI18n } from '../../test/render.tsx';
import { RoundScreen } from './RoundScreen.tsx';

// Background: I am playing "País → Capital" in "Europa · Medio" with seed 42.
const SETTINGS: RoundSettings = { topic: 'capitals', region: 'europe', level: 2 };

function roundOf(settings: RoundSettings): Question[] {
  return generateRound(countries, settings, createRng(42), relations);
}

function first(questions: readonly Question[]): Question {
  const [question] = questions;
  if (!question) throw new Error('The round has no questions');
  return question;
}

const QUESTIONS = roundOf(SETTINGS);
const FIRST = first(QUESTIONS);

function capital(entity: Entity, language: 'es' | 'en' = 'es'): string {
  if (!entity.capital) throw new Error(`${entity.code} has no quiz capital`);
  return entity.capital[language];
}

function wrongOption(question: Question): Entity {
  const wrong = question.options.find((option) => option.code !== question.entity.code);
  if (!wrong) throw new Error('A question always has wrong options');
  return wrong;
}

function renderRound(settings = SETTINGS, questions = QUESTIONS) {
  return renderWithI18n(
    <RoundScreen
      game={playableGame('CAP-A')}
      settings={settings}
      questions={questions}
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

/** Every image of the question, decorative ones too: the flag hint has alt="" next to the visible name. */
function questionImages(container: HTMLElement): HTMLImageElement[] {
  const main = container.querySelector('main');
  if (!main) throw new Error('The round has no main');
  return [...main.querySelectorAll('img')];
}

describe('RoundScreen · CAP-A', () => {
  it('CAP-A asks "¿Cuál es la capital de" followed by the country name, with its article', () => {
    renderRound();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      `¿Cuál es la capital ${ofName(FIRST.entity, 'es')}?`,
    );
  });

  it('CAP-A GAME-03 shows 4 capitals as a vertical list of large buttons, in the order of the options', () => {
    renderRound();

    const buttons = within(answers()).getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual(
      FIRST.options.map((option) => capital(option)),
    );
  });

  it('CAP-A DATA-09 the name keeps its article: «de los Países Bajos», «of the Netherlands»', () => {
    const netherlands = countries.find((country) => country.code === 'NL');
    if (!netherlands) throw new Error('The data has the Netherlands');
    const options = countries.filter((country) => ['NL', 'BE', 'DE'].includes(country.code));
    const question: Question = { entity: netherlands, options };
    const { unmount } = renderRound(SETTINGS, [question]);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      '¿Cuál es la capital de los Países Bajos?',
    );
    unmount();
    localStorage.setItem('miatlas67.language', 'en');
    renderRound(SETTINGS, [question]);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'What is the capital of the Netherlands?',
    );
  });

  it('CAP-01 at level 1 the country flag is shown next to its name', () => {
    const settings: RoundSettings = { ...SETTINGS, level: 1 };
    const questions = roundOf(settings);
    const { container } = renderRound(settings, questions);

    const images = questionImages(container);
    expect(images).toHaveLength(1);
    expect(images[0]).toHaveAttribute(
      'src',
      expect.stringMatching(flagFile(first(questions).entity.code)),
    );
  });

  it.each([2, 3] as const)('CAP-01 at level %i no flag is shown', (level) => {
    const settings: RoundSettings = { ...SETTINGS, level };
    const { container } = renderRound(settings, roundOf(settings));

    expect(questionImages(container)).toEqual([]);
  });

  it('RND-04 tapping the correct capital shows "¡Correcto!" with a ✓ icon', async () => {
    renderRound();

    await userEvent.click(screen.getByRole('button', { name: capital(FIRST.entity) }));

    expect(screen.getByRole('status')).toHaveTextContent('¡Correcto!');
    expect(within(screen.getByRole('status')).getByRole('img', { name: 'Correcta' })).toBeVisible();
    expect(
      within(optionItem(capital(FIRST.entity))).getByRole('img', { name: 'Correcta' }),
    ).toBeVisible();
    expect(screen.getByText('Aciertos: 1')).toBeVisible();
  });

  it('RND-04 tapping a wrong capital marks it ✗, highlights the right one ✓ and says "¡Uy! Era <capital>"', async () => {
    renderRound();
    const wrong = capital(wrongOption(FIRST));

    await userEvent.click(screen.getByRole('button', { name: wrong }));

    expect(within(optionItem(wrong)).getByRole('img', { name: 'Incorrecta' })).toBeVisible();
    expect(
      within(optionItem(capital(FIRST.entity))).getByRole('img', { name: 'Correcta' }),
    ).toBeVisible();
    expect(within(answers()).getAllByRole('img')).toHaveLength(2);
    expect(screen.getByRole('status')).toHaveTextContent(`¡Uy! Era ${capital(FIRST.entity)}`);
    for (const button of within(answers()).getAllByRole('button')) {
      expect(button).toBeDisabled();
    }
    expect(screen.getByText('Aciertos: 0')).toBeVisible();
  });

  it('CAP-A NFR-06 the round speaks English when English is chosen', async () => {
    localStorage.setItem('miatlas67.language', 'en');
    renderRound();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      `What is the capital ${ofName(FIRST.entity, 'en')}?`,
    );
    expect(
      within(answers())
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(FIRST.options.map((option) => capital(option, 'en')));
    await userEvent.click(screen.getByRole('button', { name: capital(wrongOption(FIRST), 'en') }));

    expect(screen.getByRole('status')).toHaveTextContent(
      `Oops! It was ${capital(FIRST.entity, 'en')}`,
    );
  });
});
