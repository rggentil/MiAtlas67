import { expectedRound, flagFile, questionAt, wrongOption } from './expected.ts';
import { expect, test } from './fixtures.ts';
import { GameSetupPage } from './pages/GameSetupPage.ts';
import { HomePage } from './pages/HomePage.ts';
import { RoundPage } from './pages/RoundPage.ts';

// Background: I am playing "Bandera → País" in "Europa · Fácil" with seed 42.
const ROUND = expectedRound({ topic: 'flags', region: 'europe', level: 1 });
const FIRST = questionAt(ROUND, 0);
const SECOND = questionAt(ROUND, 1);

test.describe('Play a FLAG-A round', () => {
  let round: RoundPage;

  test.beforeEach(async ({ page }) => {
    const home = new HomePage(page);
    const setup = new GameSetupPage(page);
    round = new RoundPage(page);
    await home.goto('?seed=42');
    await home.openGame('Bandera → País');
    await setup.chooseRegion('Europa');
    await setup.chooseLevel('Fácil');
    await expect(round.heading).toHaveText('¿De qué país es esta bandera?');
  });

  test(
    'FLAG-A GAME-03 RND-06 a flag, 3 country names as large buttons in a vertical list, and 1/10',
    { tag: ['@FLAG-A', '@GAME-03', '@RND-06'] },
    async () => {
      await expect(round.flag).toBeVisible();
      await expect(round.flag).toHaveAttribute('src', flagFile(FIRST.entity.code));
      await expect(round.options).toHaveText(FIRST.options.map((option) => option.name.es));

      const boxes = await Promise.all(
        (await round.options.all()).map((option) => option.boundingBox()),
      );
      for (const [index, box] of boxes.entries()) {
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(48);
        expect(box?.x).toBe(boxes[0]?.x);
        if (index > 0) expect(box?.y ?? 0).toBeGreaterThan(boxes[index - 1]?.y ?? 0);
      }
      await expect(round.progressText).toHaveText('1/10');
      await expect(round.score).toHaveText('Aciertos: 0');
    },
  );

  test(
    'RND-04 tapping the correct country shows "¡Correcto!" with a ✓ and adds 1 to the score',
    { tag: '@RND-04' },
    async () => {
      await round.answer(FIRST.entity.name.es);

      await expect(round.feedback).toHaveText('¡Correcto!');
      await expect(round.feedback.getByRole('img', { name: 'Correcta' })).toBeVisible();
      await expect(round.mark(FIRST.entity.name.es, 'Correcta')).toBeVisible();
      await expect(round.score).toHaveText('Aciertos: 1');
    },
  );

  test(
    'RND-04 tapping a wrong country marks it ✗, highlights the correct one ✓ and names it',
    { tag: '@RND-04' },
    async ({ makeAxeBuilder }) => {
      const wrong = wrongOption(FIRST);
      await round.answer(wrong.name.es);

      await expect(round.mark(wrong.name.es, 'Incorrecta')).toBeVisible();
      await expect(round.mark(FIRST.entity.name.es, 'Correcta')).toBeVisible();
      await expect(round.feedback).toHaveText(`¡Casi! Era ${FIRST.entity.name.es}`);
      await expect(round.score).toHaveText('Aciertos: 0');
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
    },
  );

  test(
    'RND-05 RND-03 the game waits for "Siguiente" and has no timer',
    { tag: ['@RND-05', '@RND-03'] },
    async ({ page }) => {
      await page.clock.install();
      await round.answer(FIRST.entity.name.es);
      await expect(round.nextButton).toBeVisible();

      await page.clock.fastForward('10:00');

      await expect(round.progressText).toHaveText('1/10');
      await expect(round.feedback).toHaveText('¡Correcto!');
      await expect(page.getByRole('timer')).toHaveCount(0);

      await round.nextButton.click();
      await expect(round.progressText).toHaveText('2/10');
      await expect(round.options).toHaveText(SECOND.options.map((option) => option.name.es));
      await expect(round.nextButton).toHaveCount(0);
    },
  );

  test(
    'RND-07 quitting asks for confirmation and goes back home',
    { tag: '@RND-07' },
    async ({ page, makeAxeBuilder }) => {
      await round.answer(FIRST.entity.name.es);
      await round.quitButton.click();
      await expect(round.quitDialog).toBeVisible();
      await expect(round.quitDialog).toContainText('esta partida no se guarda');
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);

      await round.quitDialog.getByRole('button', { name: 'Seguir jugando' }).click();
      await expect(round.quitDialog).toHaveCount(0);
      await expect(round.progressText).toHaveText('1/10');

      await round.quit();
      await expect(new HomePage(page).heading).toHaveText('¿A qué jugamos?');
    },
  );

  test(
    'NFR-05 the question screen has no accessibility violations and 48 × 48 px buttons',
    { tag: '@NFR-05' },
    async ({ page, makeAxeBuilder }) => {
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
      for (const button of await page.getByRole('button').all()) {
        const box = await button.boundingBox();
        expect(box?.width ?? 0).toBeGreaterThanOrEqual(48);
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(48);
      }
    },
  );
});
