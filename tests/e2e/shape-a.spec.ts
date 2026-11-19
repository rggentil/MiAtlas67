import type { Page } from '@playwright/test';
import { countries } from '../../src/data/countries.ts';
import type { RoundSettings } from '../../src/domain/questions.ts';
import { nameInSentence, wasWords } from '../../src/i18n/names.ts';
import { shapeFile } from '../../src/test/shapes.ts';
import { expectedRound, questionAt, wrongOption } from './expected.ts';
import { expect, test } from './fixtures.ts';
import { GameSetupPage } from './pages/GameSetupPage.ts';
import { HomePage } from './pages/HomePage.ts';
import { RoundPage } from './pages/RoundPage.ts';
import { SummaryPage } from './pages/SummaryPage.ts';

// Background: I am playing "Silueta → País" in "Europa · Medio" with seed 42.
const MEDIUM: RoundSettings = { topic: 'shapes', region: 'europe', level: 2 };
const EASY: RoundSettings = { ...MEDIUM, level: 1 };

test.describe('Play a SHAPE-A round', () => {
  let round: RoundPage;

  async function play(page: Page, level: 'Fácil' | 'Medio') {
    const home = new HomePage(page);
    const setup = new GameSetupPage(page);
    round = new RoundPage(page);
    await home.goto('?seed=42');
    await home.openGame('Silueta → País');
    await setup.chooseRegion('Europa');
    await setup.chooseLevel(level);
  }

  test(
    'SHAPE-A GAME-03 shows one silhouette and 4 countries as a vertical list of buttons',
    { tag: ['@SHAPE-A', '@GAME-03', '@NFR-05'] },
    async ({ page, makeAxeBuilder }) => {
      const first = questionAt(expectedRound(MEDIUM), 0);
      await play(page, 'Medio');

      await expect(round.heading).toHaveText('¿Qué país tiene esta forma?');
      await expect(round.shape).toHaveAttribute('src', shapeFile(first.entity.code));
      await expect(round.shape).toBeVisible();
      await expect(round.options).toHaveText(first.options.map((option) => option.name.es));
      const boxes = await Promise.all((await round.options.all()).map((o) => o.boundingBox()));
      for (const [index, box] of boxes.entries()) {
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(48);
        if (index > 0) expect(box?.y ?? 0).toBeGreaterThan(boxes[index - 1]?.y ?? 0);
      }
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
    },
  );

  test(
    'SHAPE-01 the silhouette has no label: neither its alt text nor the question names a country',
    { tag: ['@SHAPE-01', '@SHAPE-A'] },
    async ({ page }) => {
      await play(page, 'Medio');
      const countryNames = countries.flatMap((country) => [country.name.es, country.name.en]);

      const alt = (await round.shape.getAttribute('alt')) ?? '';
      expect(countryNames.filter((name) => alt.includes(name))).toEqual([]);
      const heading = (await round.heading.textContent()) ?? '';
      expect(countryNames.filter((name) => heading.includes(name))).toEqual([]);
    },
  );

  test(
    'RND-04 tapping the correct country shows "¡Correcto!" with a ✓',
    { tag: ['@SHAPE-A', '@RND-04'] },
    async ({ page }) => {
      const first = questionAt(expectedRound(MEDIUM), 0);
      await play(page, 'Medio');

      await round.answer(first.entity.name.es);

      await expect(round.feedback).toHaveText('¡Correcto!');
      await expect(round.mark(first.entity.name.es, 'Correcta')).toBeVisible();
      await expect(round.score).toHaveText('Aciertos: 1');
    },
  );

  test(
    'RND-04 tapping a wrong country marks it ✗, highlights the right one ✓ and names it',
    { tag: ['@SHAPE-A', '@RND-04', '@NFR-05'] },
    async ({ page, makeAxeBuilder }) => {
      const first = questionAt(expectedRound(MEDIUM), 0);
      await play(page, 'Medio');
      const wrong = wrongOption(first).name.es;

      await round.answer(wrong);

      await expect(round.mark(wrong, 'Incorrecta')).toBeVisible();
      await expect(round.mark(first.entity.name.es, 'Correcta')).toBeVisible();
      await expect(round.feedback).toHaveText(
        `¡Uy! ${wasWords(first.entity, 'es')} ${nameInSentence(first.entity, 'es')}`,
      );
      await expect(round.score).toHaveText('Aciertos: 0');
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
    },
  );

  test(
    'RND-08 the summary lists each missed country with its silhouette and its name',
    { tag: ['@SHAPE-A', '@RND-08', '@NFR-05'] },
    async ({ page, makeAxeBuilder }) => {
      const questions = expectedRound(EASY);
      await play(page, 'Fácil');

      await round.playRound(questions, [1, 6]);

      const summary = new SummaryPage(page);
      const missed = [questionAt(questions, 1).entity, questionAt(questions, 6).entity];
      await expect(summary.missed).toHaveText(missed.map((entity) => entity.name.es));
      await expect(summary.missedFlag(0)).toHaveAttribute('src', shapeFile(missed[0]?.code ?? ''));
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
    },
  );
});
