import type { Entity } from '../../src/domain/entity.ts';
import type { RoundSettings } from '../../src/domain/questions.ts';
import { ofName } from '../../src/i18n/names.ts';
import { flagFile } from '../../src/test/flags.ts';
import { openLevel } from './device.ts';
import { expectedRound, questionAt, wrongOption } from './expected.ts';
import { expect, test } from './fixtures.ts';
import { GameSetupPage } from './pages/GameSetupPage.ts';
import { HomePage } from './pages/HomePage.ts';
import { RoundPage } from './pages/RoundPage.ts';
import { SummaryPage } from './pages/SummaryPage.ts';

/** The quiz capital in Spanish: the text of a CAP-A option. */
function capital(entity: Entity): string {
  if (!entity.capital) throw new Error(`${entity.code} has no quiz capital`);
  return entity.capital.es;
}

const MEDIUM: RoundSettings = { topic: 'capitals', region: 'europe', level: 2 };
const EASY: RoundSettings = { ...MEDIUM, level: 1 };

test.describe('Play a CAP-A round', () => {
  let round: RoundPage;

  async function play(page: import('@playwright/test').Page, level: 'Fácil' | 'Medio') {
    const home = new HomePage(page);
    const setup = new GameSetupPage(page);
    round = new RoundPage(page);
    await home.goto('?seed=42');
    if (level === 'Medio') await openLevel(page, 'CAP-A', 'europe', 2);
    await home.openGame('País → Capital');
    await setup.chooseRegion('Europa');
    await setup.chooseLevel(level);
  }

  test(
    'CAP-A GAME-03 asks for the capital of a country, with 4 capitals as a vertical list of buttons',
    { tag: ['@CAP-A', '@GAME-03', '@CAP-01', '@NFR-05'] },
    async ({ page, makeAxeBuilder }) => {
      const first = questionAt(expectedRound(MEDIUM), 0);
      await play(page, 'Medio');

      await expect(round.heading).toHaveText(`¿Cuál es la capital ${ofName(first.entity, 'es')}?`);
      await expect(round.options).toHaveText(first.options.map(capital));
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
    'CAP-01 at level 1 the country flag is shown next to its name',
    { tag: ['@CAP-01', '@NFR-05'] },
    async ({ page, makeAxeBuilder }) => {
      const first = questionAt(expectedRound(EASY), 0);
      await play(page, 'Fácil');

      const flag = page.getByRole('main').locator('img');
      await expect(flag).toHaveCount(1);
      await expect(flag).toHaveAttribute('src', flagFile(first.entity.code));
      await expect(flag).toBeVisible();
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
    },
  );

  test(
    'RND-04 tapping the correct capital shows "¡Correcto!" with a ✓',
    { tag: ['@CAP-A', '@RND-04'] },
    async ({ page }) => {
      const first = questionAt(expectedRound(MEDIUM), 0);
      await play(page, 'Medio');

      await round.answer(capital(first.entity));

      await expect(round.feedback).toHaveText('¡Correcto!');
      await expect(round.mark(capital(first.entity), 'Correcta')).toBeVisible();
      await expect(round.score).toHaveText('Aciertos: 1');
    },
  );

  test(
    'RND-04 tapping a wrong capital marks it ✗, highlights the right one ✓ and names it',
    { tag: ['@CAP-A', '@RND-04'] },
    async ({ page, makeAxeBuilder }) => {
      const first = questionAt(expectedRound(MEDIUM), 0);
      await play(page, 'Medio');
      const wrong = capital(wrongOption(first));

      await round.answer(wrong);

      await expect(round.mark(wrong, 'Incorrecta')).toBeVisible();
      await expect(round.mark(capital(first.entity), 'Correcta')).toBeVisible();
      await expect(round.feedback).toHaveText(`¡Uy! Era ${capital(first.entity)}`);
      await expect(round.score).toHaveText('Aciertos: 0');
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
    },
  );

  test(
    'RND-08 the summary lists each missed country with its capital',
    { tag: ['@CAP-A', '@RND-08', '@NFR-05'] },
    async ({ page, makeAxeBuilder }) => {
      const questions = expectedRound(EASY);
      await play(page, 'Fácil');

      await round.playRound(questions, [1, 6], capital);

      const summary = new SummaryPage(page);
      const missed = [questionAt(questions, 1).entity, questionAt(questions, 6).entity];
      await expect(summary.missed).toHaveText(
        missed.map((entity) => `${entity.name.es}${capital(entity)}`),
      );
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
    },
  );
});
