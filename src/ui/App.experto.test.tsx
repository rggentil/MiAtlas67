import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { newRound } from '../data/rounds.ts';
import { isCountry } from '../domain/entity.ts';
import type { GameId } from '../domain/games.ts';
import type { Question } from '../domain/questions.ts';
import { createRng } from '../domain/random.ts';
import type { GameStore } from '../storage/store.ts';
import { deviceWith, renderApp } from '../test/app.tsx';

type Language = 'es' | 'en';

const TEXT = {
  es: {
    game: { 'FLAG-A': /^Bandera → País/, 'FLAG-B': /^País → Bandera/ },
    region: 'Oceanía',
    level: 'Experto',
    levelStep: '¿Qué nivel?',
    chips: ['Banderas', 'Oceanía', 'Experto'],
    settings: 'Esta partida',
    answers: 'Respuestas',
    option: 'Opción',
    next: 'Siguiente',
    review: 'Para repasar',
    wrong: '¡Uy! Era',
  },
  en: {
    game: { 'FLAG-A': /^Flag → Country/, 'FLAG-B': /^Country → Flag/ },
    region: 'Oceania',
    level: 'Expert',
    levelStep: 'Which level?',
    chips: ['Flags', 'Oceania', 'Expert'],
    settings: 'This round',
    answers: 'Answers',
    option: 'Option',
    next: 'Next',
    review: 'To review',
    wrong: 'Oops! It was',
  },
} as const;

/**
 * How each extended entity asked at seed 42 in "Oceanía · Experto" reads in a sentence (DATA-09, D30): «la Isla
 * Norfolk», «la Polinesia Francesa» take an article in Spanish, «the Cook Islands» and «the Northern Mariana
 * Islands» in English; the others go without one.
 */
const IN_A_SENTENCE: Readonly<Record<Language, Readonly<Record<string, string>>>> = {
  es: {
    NF: 'la Isla Norfolk',
    NU: 'Niue',
    CK: 'Islas Cook',
    MP: 'Islas Marianas del Norte',
    PF: 'la Polinesia Francesa',
  },
  en: {
    NF: 'Norfolk Island',
    NU: 'Niue',
    CK: 'the Cook Islands',
    MP: 'the Northern Mariana Islands',
    PF: 'French Polynesia',
  },
};

/** The first round of a visit with ?seed=42 in "Oceanía · Experto" of the flags games. */
function expectedRound(): Question[] {
  return newRound({ topic: 'flags', region: 'oceania', level: 4 }, createRng(42));
}

/** ★★ in Fácil, Medio and Difícil of "Oceanía" for Lucía (id 1): Experto is open (LVL-04). */
async function openExperto(store: GameStore, game: GameId): Promise<void> {
  for (const level of [1, 2, 3] as const) {
    await store.rounds.add({
      playerId: 1,
      playedAt: 1_000 * level,
      game,
      region: 'oceania',
      level,
      score: 8,
      total: 10,
      stars: 2,
      missed: [],
    });
  }
}

/** From "¿Quién juega?": Lucía, the language, the game, "Oceanía" and "Experto". */
async function startExperto(game: 'FLAG-A' | 'FLAG-B', language: Language): Promise<void> {
  const text = TEXT[language];
  await userEvent.click(screen.getByRole('button', { name: 'Lucía' }));
  if (language === 'en') await userEvent.click(screen.getByRole('radio', { name: 'English' }));
  await userEvent.click(screen.getByRole('button', { name: text.game[game] }));
  await userEvent.click(screen.getByRole('button', { name: text.region }));
  const step = screen.getByRole('region', { name: text.levelStep });
  await userEvent.click(await within(step).findByRole('button', { name: text.level }));
}

function listItems(name: string): (string | null)[] {
  return within(screen.getByRole('list', { name }))
    .getAllByRole('listitem')
    .map((item) => item.textContent);
}

/** The text of the options of the question on screen: "Bandera → País" shows the country names. */
function optionTexts(language: Language): (string | null)[] {
  return within(screen.getByRole('list', { name: TEXT[language].answers }))
    .getAllByRole('button')
    .map((button) => button.textContent);
}

function wrongOption(question: Question) {
  const wrong = question.options.find((option) => option.code !== question.entity.code);
  if (!wrong) throw new Error('A question always has wrong options');
  return wrong;
}

/** Taps an option: by its name in "Bandera → País", by its position ("Opción 2") in "País → Bandera". */
async function choose(
  game: 'FLAG-A' | 'FLAG-B',
  language: Language,
  question: Question,
  code: string,
): Promise<void> {
  const position = question.options.findIndex((option) => option.code === code);
  const option = question.options[position];
  if (!option) throw new Error(`${code} is not an option of the question`);
  const name =
    game === 'FLAG-A' ? option.name[language] : `${TEXT[language].option} ${String(position + 1)}`;
  await userEvent.click(screen.getByRole('button', { name }));
}

async function next(language: Language): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name: TEXT[language].next }));
}

const feedback = () => screen.getByRole('status');
const heading = () => screen.getByRole('heading', { level: 1 });

describe('App · Experto in Spanish and English (NFR-06, DATA-09, D30)', () => {
  // A fixed seed, so every run plays the same rounds (NFR-07).
  beforeEach(() => {
    window.history.replaceState(null, '', '/?seed=42');
  });
  afterEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  it.each(['es', 'en'] as const)(
    'NFR-06 DATA-09 RND-04 in "%s" a round of "Bandera → País" in "Oceanía · Experto" offers the names of the round and names a missed extended entity with its article',
    async (language) => {
      const text = TEXT[language];
      const store = await deviceWith();
      await openExperto(store, 'FLAG-A');
      await renderApp(store);
      await startExperto('FLAG-A', language);
      const round = expectedRound();

      expect(listItems(text.settings)).toEqual(text.chips);
      const missed: string[] = [];
      for (const question of round) {
        const { entity } = question;
        // The options are the ones the domain generates with this seed, in this language (NFR-07, NFR-06).
        expect(optionTexts(language)).toEqual(
          question.options.map((option) => option.name[language]),
        );
        if (isCountry(entity)) {
          await choose('FLAG-A', language, question, entity.code);
        } else {
          await choose('FLAG-A', language, question, wrongOption(question).code);
          const sentence = IN_A_SENTENCE[language][entity.code];
          expect(sentence, `The sentence of ${entity.code} is known`).toBeDefined();
          expect(feedback()).toHaveTextContent(`${text.wrong} ${sentence ?? ''}`);
          // The feedback is in one language only.
          const other = entity.name[language === 'es' ? 'en' : 'es'];
          if (other !== entity.name[language]) expect(feedback()).not.toHaveTextContent(other);
          // The options go on showing the name alone, whatever the sentence says.
          expect(screen.getByRole('button', { name: entity.name[language] })).toBeDisabled();
          missed.push(entity.name[language]);
        }
        await next(language);
      }

      // "Para repasar" lists the extended entities missed by their name alone, in the language chosen.
      expect(missed).toHaveLength(5);
      expect(listItems(text.review)).toEqual(missed);
    },
    30_000,
  );

  it('DATA-09 RND-04 in Spanish "País → Bandera" asks about the flag "de la Polinesia Francesa" and points at the ✓ card', async () => {
    const store = await deviceWith();
    await openExperto(store, 'FLAG-B');
    await renderApp(store);
    await startExperto('FLAG-B', 'es');
    const round = expectedRound();
    const last = round.findIndex((question) => question.entity.code === 'PF');
    expect(last, 'Polinesia Francesa is asked with seed 42 in Oceanía · Experto').toBeGreaterThan(
      -1,
    );

    for (const question of round.slice(0, last + 1)) {
      const { entity } = question;
      if (isCountry(entity)) {
        await choose('FLAG-B', 'es', question, entity.code);
      } else {
        const sentence = IN_A_SENTENCE.es[entity.code];
        expect(heading()).toHaveTextContent(`¿Cuál es la bandera de ${sentence ?? ''}?`);
        await choose('FLAG-B', 'es', question, wrongOption(question).code);
        expect(feedback()).toHaveTextContent(
          `¡Uy! La bandera de ${sentence ?? ''} es la marcada con ✓`,
        );
      }
      if (entity.code !== 'PF') await next('es');
    }

    expect(feedback()).toHaveTextContent(
      '¡Uy! La bandera de la Polinesia Francesa es la marcada con ✓',
    );
  }, 30_000);
});
