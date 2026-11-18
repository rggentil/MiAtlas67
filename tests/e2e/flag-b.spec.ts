import { countries } from '../../src/data/countries.ts';
import type { Entity } from '../../src/domain/entity.ts';
import type { Question } from '../../src/domain/questions.ts';
import { ofName } from '../../src/i18n/names.ts';
import { flagFile } from '../../src/test/flags.ts';
import { expectedRound, questionAt, wrongOption } from './expected.ts';
import { isOnTop } from './layout.ts';
import { expect, test } from './fixtures.ts';
import { GameSetupPage } from './pages/GameSetupPage.ts';
import { HomePage } from './pages/HomePage.ts';
import { RoundPage } from './pages/RoundPage.ts';

// Background: I am playing "País → Bandera" in "Europa · Medio" with seed 42.
const FIRST = questionAt(expectedRound({ topic: 'flags', region: 'europe', level: 2 }), 0);

/** "Opción N": the card of an option, by its position in the question. */
function card(question: Question, option: Entity): string {
  return `Opción ${String(question.options.indexOf(option) + 1)}`;
}

test.describe('Play a FLAG-B round', () => {
  let round: RoundPage;

  test.beforeEach(async ({ page }) => {
    const home = new HomePage(page);
    const setup = new GameSetupPage(page);
    round = new RoundPage(page);
    await home.goto('?seed=42');
    await home.openGame('País → Bandera');
    await setup.chooseRegion('Europa');
    await setup.chooseLevel('Medio');
    await expect(round.options).toHaveCount(4);
  });

  test(
    'FLAG-B GAME-03 asks for the flag of a country, with 4 flags as large cards in a grid',
    { tag: ['@FLAG-B', '@GAME-03'] },
    async () => {
      await expect(round.heading).toHaveText(`¿Cuál es la bandera ${ofName(FIRST.entity, 'es')}?`);
      await expect(round.options).toHaveText(['', '', '', '']);

      const cards = await round.options.all();
      for (const [index, option] of FIRST.options.entries()) {
        // alt="" makes the flag decorative, so it has no role: it is the card's only image.
        await expect(round.options.nth(index).locator('img')).toHaveAttribute(
          'src',
          flagFile(option.code),
        );
      }
      const boxes = await Promise.all(cards.map((option) => option.boundingBox()));
      const [first, second, third, fourth] = boxes;
      expect(second?.y).toBe(first?.y);
      expect(second?.x ?? 0).toBeGreaterThan(first?.x ?? 0);
      expect(third?.x).toBe(first?.x);
      expect(third?.y ?? 0).toBeGreaterThan(first?.y ?? 0);
      expect(fourth?.x).toBe(second?.x);
      expect(fourth?.y).toBe(third?.y);
      for (const box of boxes) {
        expect(box?.width ?? 0).toBeGreaterThanOrEqual(120);
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(90);
      }
    },
  );

  test(
    'RND-04 tapping the correct flag shows "¡Correcto!" with a ✓',
    { tag: ['@FLAG-B', '@RND-04'] },
    async () => {
      await round.answer(card(FIRST, FIRST.entity));

      await expect(round.feedback).toHaveText('¡Correcto!');
      await expect(round.feedbackMark('Correcta')).toBeVisible();
      await expect(round.mark(card(FIRST, FIRST.entity), 'Correcta')).toBeVisible();
      await expect(round.score).toHaveText('Aciertos: 1');
    },
  );

  test(
    'RND-04 tapping a wrong flag marks it ✗ and highlights the correct flag ✓',
    { tag: ['@FLAG-B', '@RND-04'] },
    async ({ makeAxeBuilder }) => {
      const wrong = card(FIRST, wrongOption(FIRST));
      await round.answer(wrong);

      await expect(round.mark(wrong, 'Incorrecta')).toBeVisible();
      await expect(round.mark(card(FIRST, FIRST.entity), 'Correcta')).toBeVisible();
      await expect(round.feedback).toHaveText(
        `¡Uy! La bandera ${ofName(FIRST.entity, 'es')} es la marcada con ✓`,
      );
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
    },
  );

  test(
    'FLAG-B the cards are named "Opción 1" to "Opción 4" and nothing in them names a country',
    { tag: ['@FLAG-B', '@NFR-05'] },
    async () => {
      const countryNames = countries.flatMap((country) => [country.name.es, country.name.en]);

      for (const [index, option] of (await round.options.all()).entries()) {
        await expect(option).toHaveAccessibleName(`Opción ${String(index + 1)}`);
        await expect(option.locator('img')).toHaveAttribute('alt', '');
      }
      const before = await round.answers.ariaSnapshot();
      await round.answer(card(FIRST, wrongOption(FIRST)));
      await expect(round.nextButton).toBeVisible();
      const after = await round.answers.ariaSnapshot();

      for (const snapshot of [before, after]) {
        expect(countryNames.filter((name) => snapshot.includes(name))).toEqual([]);
      }
    },
  );

  test(
    'NFR-05 the FLAG-B round has no accessibility violations before answering',
    { tag: '@NFR-05' },
    async ({ makeAxeBuilder }) => {
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
    },
  );
});

test.describe('A tall grid of flags on a short screen', () => {
  // Level Difícil has 6 flags in 3 rows: on a phone the grid goes below the feedback panel.
  const HARD = questionAt(expectedRound({ topic: 'flags', region: 'europe', level: 3 }), 0);

  test(
    'RND-04 after answering a flag, the ✓ and the ✗ are not hidden behind the feedback panel',
    { tag: ['@FLAG-B', '@RND-04'] },
    async ({ page }) => {
      const home = new HomePage(page);
      const setup = new GameSetupPage(page);
      const round = new RoundPage(page);
      await home.goto('?seed=42');
      await home.openGame('País → Bandera');
      await setup.chooseRegion('Europa');
      await setup.chooseLevel('Difícil');
      await expect(round.options).toHaveCount(6);

      const last = HARD.options.at(-1);
      const tapped = last && last.code !== HARD.entity.code ? last : wrongOption(HARD);
      await round.answer(card(HARD, tapped));

      await expect(round.nextButton).toBeFocused();
      expect(await isOnTop(round.mark(card(HARD, tapped), 'Incorrecta'))).toBe(true);
      expect(await isOnTop(round.mark(card(HARD, HARD.entity), 'Correcta'))).toBe(true);
    },
  );
});
