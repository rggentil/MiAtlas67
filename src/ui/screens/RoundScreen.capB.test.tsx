import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { countries } from '../../data/countries.ts';
import { relations } from '../../data/relations.ts';
import type { Entity } from '../../domain/entity.ts';
import { generateRound, type Question, type RoundSettings } from '../../domain/questions.ts';
import { createRng } from '../../domain/random.ts';
import { nameInSentence, wasWords } from '../../i18n/names.ts';
import { flagFile } from '../../test/flags.ts';
import { playableGame } from '../../test/games.ts';
import { renderWithI18n } from '../../test/render.tsx';
import { RoundScreen } from './RoundScreen.tsx';

// Background: I am playing "Capital → País" in "Europa · Medio" with seed 42.
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
      game={playableGame('CAP-B')}
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

describe('RoundScreen · CAP-B', () => {
  it('CAP-B asks "¿De qué país es capital" followed by the capital', () => {
    renderRound();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      `¿De qué país es capital ${capital(FIRST.entity)}?`,
    );
  });

  it('CAP-B GAME-03 shows 4 countries as buttons, in the order of the options, with no flags at level 2', () => {
    renderRound();

    const buttons = within(answers()).getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual(
      FIRST.options.map((option) => option.name.es),
    );
    expect(answers().querySelectorAll('img')).toHaveLength(0);
  });

  it('CAP-01 at level 1 each country option shows its own flag next to its name', () => {
    const settings: RoundSettings = { ...SETTINGS, level: 1 };
    const question = first(roundOf(settings));
    renderRound(settings, [question]);

    const buttons = within(answers()).getAllByRole('button');
    expect(buttons).toHaveLength(question.options.length);
    question.options.forEach((option, index) => {
      const button = buttons[index];
      // The flag is decorative: the button is still named by the country alone.
      expect(button).toHaveAccessibleName(option.name.es);
      expect(button?.querySelector('img')).toHaveAttribute(
        'src',
        expect.stringMatching(flagFile(option.code)),
      );
    });
  });

  it('CAP-01 at level 3 no flag is shown', () => {
    const settings: RoundSettings = { ...SETTINGS, level: 3 };
    renderRound(settings, roundOf(settings));

    expect(answers().querySelectorAll('img')).toHaveLength(0);
  });

  it('RND-04 tapping the correct country shows "¡Correcto!" with a ✓ icon', async () => {
    renderRound();

    await userEvent.click(screen.getByRole('button', { name: FIRST.entity.name.es }));

    expect(screen.getByRole('status')).toHaveTextContent('¡Correcto!');
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
    expect(screen.getByText('Aciertos: 0')).toBeVisible();
  });

  it('CAP-B DATA-09 a miss keeps the article: «¡Uy! Eran los Países Bajos»', async () => {
    const byCode = (code: string): Entity => {
      const found = countries.find((country) => country.code === code);
      if (!found) throw new Error(`No ${code}`);
      return found;
    };
    renderRound(SETTINGS, [{ entity: byCode('NL'), options: [byCode('BE'), byCode('NL')] }]);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      '¿De qué país es capital Ámsterdam?',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Bélgica' }));

    expect(screen.getByRole('status')).toHaveTextContent('¡Uy! Eran los Países Bajos');
  });

  it('CAP-B NFR-06 the round speaks English when English is chosen', async () => {
    localStorage.setItem('miatlas67.language', 'en');
    renderRound();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      `Which country has the capital ${capital(FIRST.entity, 'en')}?`,
    );
    expect(
      within(answers())
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(FIRST.options.map((option) => option.name.en));
    await userEvent.click(screen.getByRole('button', { name: wrongOption(FIRST).name.en }));

    expect(screen.getByRole('status')).toHaveTextContent(
      `Oops! It was ${nameInSentence(FIRST.entity, 'en')}`,
    );
  });
});
