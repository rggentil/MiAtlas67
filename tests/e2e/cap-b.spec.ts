import type { Page } from '@playwright/test';
import type { Entity } from '../../src/domain/entity.ts';
import type { RoundSettings } from '../../src/domain/questions.ts';
import { nameInSentence, wasWords } from '../../src/i18n/names.ts';
import { flagFile } from '../../src/test/flags.ts';
import { expectedRound, questionAt, wrongOption } from './expected.ts';
import { isOnTop } from './layout.ts';
import { expect, test } from './fixtures.ts';
import { GameSetupPage } from './pages/GameSetupPage.ts';
import { HomePage } from './pages/HomePage.ts';
import { RoundPage } from './pages/RoundPage.ts';
import { SummaryPage } from './pages/SummaryPage.ts';

/** The quiz capital in Spanish: the question of CAP-B. */
function capital(entity: Entity): string {
  if (!entity.capital) throw new Error(`${entity.code} has no quiz capital`);
  return entity.capital.es;
}

const MEDIUM: RoundSettings = { topic: 'capitals', region: 'europe', level: 2 };
const EASY: RoundSettings = { ...MEDIUM, level: 1 };

test.describe('Play a CAP-B round', () => {
  let round: RoundPage;

  async function play(page: Page, level: 'Fácil' | 'Medio') {
    const home = new HomePage(page);
    const setup = new GameSetupPage(page);
    round = new RoundPage(page);
    await home.goto('?seed=42');
    await home.openGame('Capital → País');
    await setup.chooseRegion('Europa');
    await setup.chooseLevel(level);
  }

  test(
    'CAP-B GAME-03 asks which country a capital belongs to, with 4 countries as a vertical list of buttons',
    { tag: ['@CAP-B', '@GAME-03', '@CAP-01', '@NFR-05'] },
    async ({ page, makeAxeBuilder }) => {
      const first = questionAt(expectedRound(MEDIUM), 0);
      await play(page, 'Medio');

      await expect(round.heading).toHaveText(`¿De qué país es capital ${capital(first.entity)}?`);
      await expect(round.options).toHaveText(first.options.map((option) => option.name.es));
      const boxes = await Promise.all((await round.options.all()).map((o) => o.boundingBox()));
      for (const [index, box] of boxes.entries()) {
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(48);
        if (index > 0) expect(box?.y ?? 0).toBeGreaterThan(boxes[index - 1]?.y ?? 0);
      }
      // CAP-01: no flag hint after level 1.
      await expect(page.getByRole('main').locator('img')).toHaveCount(0);
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
    },
  );

  test(
    'CAP-01 at level 1 each country option shows its flag next to its name',
    { tag: ['@CAP-01', '@NFR-05'] },
    async ({ page, makeAxeBuilder }) => {
      const first = questionAt(expectedRound(EASY), 0);
      await play(page, 'Fácil');

      for (const [index, option] of first.options.entries()) {
        const button = round.options.nth(index);
        await expect(button).toHaveAccessibleName(option.name.es);
        await expect(button.locator('img')).toHaveAttribute('src', flagFile(option.code));
        await expect(button.locator('img')).toBeVisible();
      }
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
    },
  );

  test(
    'RND-04 tapping the correct country shows "¡Correcto!" with a ✓',
    { tag: ['@CAP-B', '@RND-04'] },
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
    { tag: ['@CAP-B', '@RND-04', '@NFR-05'] },
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
    'RND-08 the summary lists each missed capital with its country',
    { tag: ['@CAP-B', '@RND-08', '@NFR-05'] },
    async ({ page, makeAxeBuilder }) => {
      const questions = expectedRound(EASY);
      await play(page, 'Fácil');

      await round.playRound(questions, [1, 6]);

      const summary = new SummaryPage(page);
      const missed = [questionAt(questions, 1).entity, questionAt(questions, 6).entity];
      await expect(summary.missed).toHaveText(
        missed.map((entity) => `${capital(entity)}${entity.name.es}`),
      );
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
    },
  );

  test(
    'RND-04 at level 1, with flags in the options, the ✓ and the ✗ are not hidden behind the feedback panel',
    { tag: ['@CAP-B', '@RND-04', '@CAP-01'] },
    async ({ page }) => {
      const first = questionAt(expectedRound(EASY), 0);
      await play(page, 'Fácil');
      const last = first.options.at(-1);
      const tapped = last && last.code !== first.entity.code ? last : wrongOption(first);

      await round.answer(tapped.name.es);

      await expect(round.nextButton).toBeFocused();
      expect(await isOnTop(round.mark(tapped.name.es, 'Incorrecta'))).toBe(true);
      expect(await isOnTop(round.mark(first.entity.name.es, 'Correcta'))).toBe(true);
    },
  );
});
