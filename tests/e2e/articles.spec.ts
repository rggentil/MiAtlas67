import type { Page } from '@playwright/test';
import type { Entity } from '../../src/domain/entity.ts';
import type { Question, RoundSettings } from '../../src/domain/questions.ts';
import { expectedRound, questionAt, seedAskingFirst, wrongOption } from './expected.ts';
import { expect, test } from './fixtures.ts';
import { GameSetupPage } from './pages/GameSetupPage.ts';
import { HomePage } from './pages/HomePage.ts';
import { RoundPage } from './pages/RoundPage.ts';

// A name in a sentence keeps the article it takes (DATA-09, D18). The seed is the first one whose round in
// "Europa · Fácil" asks about Reino Unido (or Países Bajos) first, so the test follows the data.
const SETTINGS: RoundSettings = { topic: 'flags', region: 'europe', level: 1 };
const SEED = seedAskingFirst(SETTINGS, 'GB');
const FIRST = questionAt(expectedRound(SETTINGS, SEED), 0);
const WRONG = wrongOption(FIRST);

const NETHERLANDS_SEED = seedAskingFirst(SETTINGS, 'NL');
const NETHERLANDS_FIRST = questionAt(expectedRound(SETTINGS, NETHERLANDS_SEED), 0);
const NETHERLANDS_WRONG = wrongOption(NETHERLANDS_FIRST);

async function startRound(page: Page, game: string, seed = SEED): Promise<RoundPage> {
  const home = new HomePage(page);
  const setup = new GameSetupPage(page);
  await home.goto(`?seed=${String(seed)}`);
  await home.openGame(game);
  await setup.chooseRegion('Europa');
  await setup.chooseLevel('Fácil');
  return new RoundPage(page);
}

/** The same round in English (SET-01). */
async function startRoundInEnglish(page: Page, game: string): Promise<RoundPage> {
  const home = new HomePage(page);
  const setup = new GameSetupPage(page, 'en');
  await home.goto(`?seed=${String(SEED)}`);
  await home.chooseLanguage('English');
  await home.openGame(game);
  await setup.chooseRegion('Europe');
  await setup.chooseLevel('Easy');
  return new RoundPage(page);
}

/** "Opción N" / "Option N": the card of `wrong` among the options of `question`, in "País → Bandera". */
function wrongCard(
  prefix: 'Opción' | 'Option',
  question: Question = FIRST,
  wrong: Entity = WRONG,
): string {
  return `${prefix} ${String(question.options.indexOf(wrong) + 1)}`;
}

test.describe('Names with their article in sentences', () => {
  test(
    'DATA-09 FLAG-B asks "¿Cuál es la bandera del Reino Unido?", and a miss points at the flag "del Reino Unido"',
    { tag: ['@DATA-09', '@FLAG-B', '@RND-04'] },
    async ({ page }) => {
      const round = await startRound(page, 'País → Bandera');
      await expect(round.heading).toHaveText('¿Cuál es la bandera del Reino Unido?');

      await round.answer(wrongCard('Opción'));

      await expect(round.feedback).toHaveText(
        '¡Uy! La bandera del Reino Unido es la marcada con ✓',
      );
    },
  );

  test(
    'DATA-09 FLAG-A the options show "Reino Unido" alone, and a miss names "el Reino Unido"',
    { tag: ['@DATA-09', '@FLAG-A', '@RND-04'] },
    async ({ page }) => {
      const round = await startRound(page, 'Bandera → País');
      await expect(round.option('Reino Unido')).toBeVisible();

      await round.answer(WRONG.name.es);

      await expect(round.feedback).toHaveText('¡Uy! Era el Reino Unido');
    },
  );

  test(
    'DATA-09 SET-01 FLAG-B in English: "Which one is the flag of the United Kingdom?", and a miss points at "the flag of the United Kingdom"',
    { tag: ['@DATA-09', '@SET-01', '@FLAG-B', '@RND-04'] },
    async ({ page }) => {
      const flagB = await startRoundInEnglish(page, 'Country → Flag');
      await expect(flagB.heading).toHaveText('Which one is the flag of the United Kingdom?');
      await flagB.answer(wrongCard('Option'));
      await expect(flagB.feedback).toHaveText(
        'Oops! The flag of the United Kingdom is the one marked ✓',
      );
    },
  );

  test(
    'DATA-09 SET-01 FLAG-A in English: the options show "United Kingdom" alone, and a miss says "Oops! It was the United Kingdom"',
    { tag: ['@DATA-09', '@SET-01', '@FLAG-A', '@RND-04'] },
    async ({ page }) => {
      const flagA = await startRoundInEnglish(page, 'Flag → Country');
      await expect(flagA.option('United Kingdom')).toBeVisible();
      await flagA.answer(WRONG.name.en);
      await expect(flagA.feedback).toHaveText('Oops! It was the United Kingdom');
    },
  );

  test(
    'DATA-09 FLAG-B asks "¿Cuál es la bandera de los Países Bajos?", and a miss points at the flag "de los Países Bajos"',
    { tag: ['@DATA-09', '@FLAG-B', '@RND-04'] },
    async ({ page }) => {
      const round = await startRound(page, 'País → Bandera', NETHERLANDS_SEED);
      await expect(round.heading).toHaveText('¿Cuál es la bandera de los Países Bajos?');

      await round.answer(wrongCard('Opción', NETHERLANDS_FIRST, NETHERLANDS_WRONG));

      await expect(round.feedback).toHaveText(
        '¡Uy! La bandera de los Países Bajos es la marcada con ✓',
      );
    },
  );

  test(
    'DATA-09 FLAG-A the options show "Países Bajos" alone, and a miss agrees with the plural: "Eran los Países Bajos"',
    { tag: ['@DATA-09', '@FLAG-A', '@RND-04'] },
    async ({ page }) => {
      const round = await startRound(page, 'Bandera → País', NETHERLANDS_SEED);
      await expect(round.option('Países Bajos')).toBeVisible();

      await round.answer(NETHERLANDS_WRONG.name.es);

      await expect(round.feedback).toHaveText('¡Uy! Eran los Países Bajos');
    },
  );
});
